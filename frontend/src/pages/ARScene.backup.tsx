import { useEffect, useRef, useState } from "react";
import { ARPoint, listPoints } from "../services/pointsService";
import { capturePoint } from "../services/captureService";
import { useAuthStore } from "../store/authStore";
import { CaptureOverlay } from "../components/CaptureOverlay";
import { VictoryModal } from "../components/VictoryModal";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";
import { resolveAssetUrl } from "../utils/assetUrl";

const VICTORY_SCORE = 4;

const buildTargetUrls = () => {
  const urls = ["/targets.mind"];
  const host = window.location.hostname.toLowerCase();

  if (host.includes("ngrok")) {
    urls.unshift("/targets.mind?ngrok-skip-browser-warning=true");
  }

  return urls;
};

const fetchTargetsMind = async () => {
  let lastError: Error | null = null;

  for (const targetUrl of buildTargetUrls()) {
    try {
      const headers: Record<string, string> = {};
      if (targetUrl.includes("ngrok-skip-browser-warning")) {
        headers["ngrok-skip-browser-warning"] = "true";
      }

      const resp = await fetch(targetUrl, {
        headers,
        cache: "no-store",
      });

      if (!resp.ok) {
        const ct = resp.headers.get("content-type") || "";
        throw new Error(`status ${resp.status} ct=${ct} url=${targetUrl}`);
      }

      const blob = await resp.blob();
      if (blob.size === 0) {
        throw new Error(`arquivo vazio url=${targetUrl}`);
      }

      return URL.createObjectURL(blob);
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error("falha ao baixar targets.mind");
};

export default function ARScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindarRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const targetSrcRef = useRef<string | null>(null);
  const capturedIdsRef = useRef<Set<string>>(new Set());
  const sceneMapRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const [points, setPoints] = useState<ARPoint[]>([]);
  const [started, setStarted] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelErrors, setModelErrors] = useState<string[]>([]);
  const [overlay, setOverlay] = useState<{ show: boolean; points: number; text: string }>({
    show: false,
    points: 0,
    text: "",
  });
  const [visiblePoint, setVisiblePoint] = useState<ARPoint | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [capturedIds, setCapturedIds] = useState<Set<string>>(new Set());
  const { updateScore, user } = useAuthStore();

  const victoryStorageKey = user ? `victory-modal-seen:${user.id}` : null;

  const openVictoryModal = () => {
    setShowVictoryModal(true);
    if (victoryStorageKey) {
      window.sessionStorage.setItem(victoryStorageKey, "true");
    }
  };

  const cleanupAR = () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    mindarRef.current?.stop?.();
    mindarRef.current?.renderer?.dispose?.();
    mindarRef.current = null;

    if (targetSrcRef.current) {
      URL.revokeObjectURL(targetSrcRef.current);
      targetSrcRef.current = null;
    }

    sceneMapRef.current.clear();
    setVisiblePoint(null);
    containerRef.current?.replaceChildren();
  };

  useEffect(() => {
    if (!user || user.totalScore < VICTORY_SCORE || !victoryStorageKey) return;
    if (window.sessionStorage.getItem(victoryStorageKey) === "true") return;
    setShowVictoryModal(true);
    window.sessionStorage.setItem(victoryStorageKey, "true");
  }, [user, victoryStorageKey]);

  useEffect(() => {
    listPoints()
      .then((res) => setPoints(res.filter((p) => !p.captured)))
      .catch((e) => {
        console.error(e);
        setError("Falha ao carregar pontos AR.");
      });
  }, []);

  useEffect(() => {
    return () => {
      cleanupAR();
    };
  }, []);

  const startAR = async () => {
    if (!containerRef.current || points.length === 0 || requesting || started) return;

    setError(null);
    setModelErrors([]);
    setRequesting(true);
    cleanupAR();

    try {
      let renderer: THREE.WebGLRenderer;
      let scene: THREE.Scene;
      let camera: THREE.Camera;
      const mixers: THREE.AnimationMixer[] = [];

      try {
        targetSrcRef.current = await fetchTargetsMind();
      } catch (fetchErr) {
        console.error("Erro baixando targets.mind", fetchErr);
        const detail = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        setError(`NÃ£o foi possÃ­vel baixar targets.mind (${detail}).`);
        return;
      }

      if (!targetSrcRef.current) {
        setError("targets.mind nÃ£o disponÃ­vel.");
        return;
      }

      const mindar = new MindARThree({
        container: containerRef.current,
        imageTargetSrc: targetSrcRef.current,
        uiLoading: "no",
        uiScanning: "no",
        uiError: "no",
      });
      mindarRef.current = mindar;

      const { renderer: r, scene: s, camera: c } = mindar;
      renderer = r;
      scene = s;
      camera = c;

      const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
      scene.add(light);

      const failedModels: string[] = [];

      for (const p of points) {
        const anchor = mindar.addAnchor(p.targetIndex ?? 0);
        let gltf: any;
        try {
          gltf = await loadModel(p.modelUrl);
        } catch (modelErr) {
          const label = `${p.name || p.slug || p.id} (targetIndex ${p.targetIndex ?? 0})`;
          failedModels.push(label);
          console.error(`Falha ao carregar modelo do ponto ${label}:`, p.modelUrl, modelErr);
          continue;
        }

        gltf.scene.position.set(p.posX, p.posY, p.posZ);
        gltf.scene.rotation.set(p.rotX, p.rotY, p.rotZ);
        gltf.scene.scale.set(p.scaleX, p.scaleY, p.scaleZ);
        anchor.group.add(gltf.scene);
        sceneMapRef.current.set(p.id, gltf.scene);

        const mixer = gltf.animations.length ? new THREE.AnimationMixer(gltf.scene) : null;
        if (mixer) {
          const action = mixer.clipAction(gltf.animations[0]);
          action.play();
          mixers.push(mixer);
        }

        anchor.onTargetFound = () => {
          setVisiblePoint((current) => {
            if (capturedIdsRef.current.has(p.id)) return current;
            return p;
          });
        };

        anchor.onTargetLost = () => {
          setVisiblePoint((current) => (current?.id === p.id ? null : current));
        };
      }

      if (failedModels.length > 0) {
        setModelErrors(failedModels);
      }

      await mindar.start();
      setStarted(true);

      const clock = new THREE.Clock();
      const loop = () => {
        const delta = clock.getDelta();
        mixers.forEach((m) => m.update(delta));
        renderer.render(scene, camera);
        animationFrameRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch (e) {
      console.error(e);
      cleanupAR();
      setStarted(false);
      setError("NÃ£o foi possÃ­vel iniciar a cÃ¢mera/AR. Verifique permissÃµes e tente novamente.");
    } finally {
      setRequesting(false);
    }
  };

  const handleCapture = async () => {
    if (!visiblePoint || capturing || capturedIdsRef.current.has(visiblePoint.id)) return;
    setCapturing(true);
    try {
      const res = await capturePoint(visiblePoint.id);
      updateScore(res.totalScore);
      const next = new Set(capturedIdsRef.current);
      next.add(visiblePoint.id);
      capturedIdsRef.current = next;
      setCapturedIds(next);
      const scene = sceneMapRef.current.get(visiblePoint.id);
      if (scene) scene.visible = false;
      setOverlay({
        show: true,
        points: res.earnedPoints,
        text: res.alreadyCaptured ? "JÃ¡ capturado" : "Capturado!",
      });
      if (!res.alreadyCaptured && res.totalScore >= VICTORY_SCORE) {
        openVictoryModal();
      }
      setTimeout(() => setOverlay((o) => ({ ...o, show: false })), 2000);
      setVisiblePoint(null);
    } catch (e) {
      console.error(e);
      setError("NÃ£o foi possÃ­vel registrar a captura. Tente novamente.");
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="mt-4">
      <div className="fixed top-4 right-4 z-20">
        <div className="bg-slate-900/80 border border-accent/40 rounded-2xl px-4 py-2 shadow-lg backdrop-blur">
          <p className="text-xs text-slate-300">Seus pontos</p>
          <p className="text-2xl font-black text-accent drop-shadow">
            {user?.totalScore ?? 0} <span className="text-sm font-semibold text-slate-200">pts</span>
          </p>
        </div>
      </div>

      {(error || modelErrors.length > 0) && (
        <div className="glass p-3 rounded-2xl mb-3">
          {error && <p className="text-sm text-red-300">{error}</p>}
          {modelErrors.length > 0 && (
            <p className={`text-sm text-amber-300 ${error ? "mt-2" : ""}`}>
              Modelos com erro: {modelErrors.join(", ")}
            </p>
          )}
        </div>
      )}

      <div className="mindar-stage relative w-full h-[calc(100vh-9.5rem)] rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/30">
        <div ref={containerRef} className="w-full h-full bg-transparent" />
        {!started && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/35 backdrop-blur-[1px]">
            <button
              className="bg-primary text-white px-6 py-3 rounded-lg shadow-lg"
              onClick={startAR}
              disabled={points.length === 0 || requesting}
            >
              {points.length === 0 ? "Carregando pontos..." : requesting ? "Solicitando cÃ¢mera..." : "Iniciar AR"}
            </button>
          </div>
        )}
      </div>

      <div className="fixed bottom-4 left-0 right-0 px-4 z-20 pointer-events-none">
        <div className="flex flex-col gap-2 items-center">
          <div className="min-h-[3rem] px-4 py-2 rounded-xl bg-slate-900/70 backdrop-blur border border-slate-700 text-center pointer-events-auto">
            <p className="text-slate-200 text-sm">
              {visiblePoint ? `Pokejoy detectado: ${visiblePoint.name || visiblePoint.slug}` : "Nenhum pokejoy na mira"}
            </p>
          </div>
          <button
            className={`pointer-events-auto w-full max-w-md bg-gradient-to-r from-accent to-primary text-white font-semibold py-3 rounded-xl shadow-[0_10px_40px_-12px_rgba(79,70,229,0.8)] transition hover:-translate-y-[1px] hover:shadow-[0_12px_45px_-10px_rgba(79,70,229,0.95)] active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={!visiblePoint || capturing || capturedIds.has(visiblePoint?.id ?? "")}
            onClick={handleCapture}
          >
            {capturing
              ? "Capturando..."
              : !visiblePoint
                ? "Aguarde um pokejoy"
                : capturedIds.has(visiblePoint.id)
                  ? "JÃ¡ capturado"
                  : "Capturar pokejoy"}
          </button>
        </div>
      </div>

      <CaptureOverlay show={overlay.show} text={overlay.text} points={overlay.points} />
      <VictoryModal open={showVictoryModal} onClose={() => setShowVictoryModal(false)} />
    </div>
  );
}

const loadModel = (url: string) =>
  new Promise<any>((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(resolveAssetUrl(url), resolve, undefined, reject);
  });
