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

const VICTORY_SCORE = 8;

export default function ARScene() {
  const containerRef = useRef<HTMLDivElement>(null);
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
  const capturedIdsRef = useRef<Set<string>>(new Set());
  const sceneMapRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const { updateScore, user } = useAuthStore();

  const victoryStorageKey = user ? `victory-modal-seen:${user.id}` : null;

  const openVictoryModal = () => {
    setShowVictoryModal(true);
    if (victoryStorageKey) {
      window.sessionStorage.setItem(victoryStorageKey, "true");
    }
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
    if (!containerRef.current || points.length === 0 || !started) return;
    setError(null);
    setModelErrors([]);
    sceneMapRef.current.clear();
    let stop = false;
    let mindar: any = null;
    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.Camera;
    let mixers: THREE.AnimationMixer[] = [];

    (async () => {
      try {
        // Sempre anexa query e header para evitar aviso do ngrok
        const targetUrl = "/targets.mind?ngrok-skip-browser-warning=true";
        let targetSrc: string | null = null;
        try {
          const resp = await fetch(targetUrl, {
            headers: { "ngrok-skip-browser-warning": "true" },
            cache: "no-store",
          });
          if (!resp.ok) {
            const ct = resp.headers.get("content-type") || "";
            throw new Error(`targets.mind status ${resp.status} ct=${ct}`);
          }
          const blob = await resp.blob();
          if (blob.size === 0) {
            throw new Error("targets.mind vazio");
          }
          targetSrc = URL.createObjectURL(blob);
        } catch (fetchErr) {
          console.error("Erro baixando targets.mind", fetchErr);
          setError("N\u00e3o foi poss\u00edvel baixar targets.mind (confira o t\u00fanel/arquivo).");
          return;
        }

        if (!targetSrc) {
          setError("targets.mind n\u00e3o dispon\u00edvel.");
          return;
        }

        mindar = new MindARThree({
          container: containerRef.current!,
          imageTargetSrc: targetSrc,
          uiLoading: "no",
          uiScanning: "no",
          uiError: "no",
        });
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

        const clock = new THREE.Clock();
        const loop = () => {
          if (stop) return;
          const delta = clock.getDelta();
          mixers.forEach((m) => m.update(delta));
          renderer.render(scene, camera);
          requestAnimationFrame(loop);
        };
        loop();
      } catch (e: any) {
        console.error(e);
        setError("N\u00e3o foi poss\u00edvel iniciar a c\u00e2mera/AR. Verifique permiss\u00f5es e tente novamente.");
      }
    })();

    return () => {
      stop = true;
      mindar?.stop();
      mindar?.renderer?.dispose();
      containerRef.current?.replaceChildren();
    };
  }, [points, started]);

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
        text: res.alreadyCaptured ? "J\u00e1 capturado" : "Capturado!",
      });
      if (!res.alreadyCaptured && res.totalScore >= VICTORY_SCORE) {
        openVictoryModal();
      }
      setTimeout(() => setOverlay((o) => ({ ...o, show: false })), 2000);
      setVisiblePoint(null);
    } catch (e) {
      console.error(e);
      setError("N\u00e3o foi poss\u00edvel registrar a captura. Tente novamente.");
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

      {!started ? (
        <div className="mindar-stage w-full h-[calc(100vh-9.5rem)] rounded-2xl overflow-hidden bg-slate-900/40 flex items-center justify-center border border-slate-700">
          <button
            className="bg-primary text-white px-6 py-3 rounded-lg shadow-lg"
            onClick={async () => {
              setError(null);
              setRequesting(true);
              try {
                // Gesto explícito + solicitação de permissão antes do MindAR
                const stream = await navigator.mediaDevices.getUserMedia({
                  video: { facingMode: { ideal: "environment" } },
                });
                stream.getTracks().forEach((t) => t.stop());
                setStarted(true);
              } catch (e: any) {
                console.error(e);
                setError("Permita acesso \u00e0 c\u00e2mera para iniciar a AR.");
              } finally {
                setRequesting(false);
              }
            }}
            disabled={points.length === 0 || requesting}
          >
            {points.length === 0 ? "Carregando pontos..." : requesting ? "Solicitando c\u00e2mera..." : "Iniciar AR"}
          </button>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="mindar-stage relative w-full h-[calc(100vh-9.5rem)] rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/30"
        />
      )}

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
                  ? "J\u00e1 capturado"
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
