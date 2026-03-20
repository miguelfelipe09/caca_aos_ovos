import { useEffect, useRef, useState } from "react";
import { ARPoint, listPoints } from "../services/pointsService";
import { capturePoint } from "../services/captureService";
import { useAuthStore } from "../store/authStore";
import { CaptureOverlay } from "../components/CaptureOverlay";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";

export default function ARScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState<ARPoint[]>([]);
  const [started, setStarted] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<{ show: boolean; points: number; text: string }>({
    show: false,
    points: 0,
    text: "",
  });
  const { updateScore } = useAuthStore();

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
          setError("Não foi possível baixar targets.mind (confira o túnel/arquivo).");
          return;
        }

        if (!targetSrc) {
          setError("targets.mind não disponível.");
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

        for (const p of points) {
          const anchor = mindar.addAnchor(p.targetIndex ?? 0);
          const gltf = await loadModel(p.modelUrl);
          gltf.scene.position.set(p.posX, p.posY, p.posZ);
          gltf.scene.rotation.set(p.rotX, p.rotY, p.rotZ);
          gltf.scene.scale.set(p.scaleX, p.scaleY, p.scaleZ);
          anchor.group.add(gltf.scene);
          const mixer = gltf.animations.length ? new THREE.AnimationMixer(gltf.scene) : null;
          if (mixer) {
            const action = mixer.clipAction(gltf.animations[0]);
            action.play();
            mixers.push(mixer);
          }

          // raycast on click
          const raycaster = new THREE.Raycaster();
          const clickHandler = async (event: MouseEvent) => {
            const rect = renderer.domElement.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera({ x, y }, camera as THREE.Camera);
            const intersects = raycaster.intersectObject(gltf.scene, true);
            if (intersects.length > 0) {
              const res = await capturePoint(p.id);
              updateScore(res.totalScore);
              setOverlay({ show: true, points: res.earnedPoints, text: res.alreadyCaptured ? "Já capturado" : "Capturado!" });
              setTimeout(() => setOverlay((o) => ({ ...o, show: false })), 1800);
              gltf.scene.visible = false;
            }
          };
          renderer.domElement.addEventListener("click", clickHandler);
          anchor.onTargetLost = () => {
            renderer.domElement.removeEventListener("click", clickHandler);
          };
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
        setError("Não foi possível iniciar a câmera/AR. Verifique permissões e tente novamente.");
      }
    })();

    return () => {
      stop = true;
      mindar?.stop();
      mindar?.renderer?.dispose();
      containerRef.current?.replaceChildren();
    };
  }, [points, updateScore, started]);

  return (
    <div className="mt-4">
      <div className="glass p-3 rounded-2xl mb-3">
        <p className="text-sm text-slate-200">
          Aponte a câmera para as imagens-alvo. Toque no personagem para capturar. Já capturados não aparecem novamente.
        </p>
        {!started && <p className="text-sm text-amber-300 mt-2">Toque em "Iniciar AR" para liberar a câmera.</p>}
        {error && <p className="text-sm text-red-300 mt-2">{error}</p>}
      </div>
      {!started ? (
        <div className="w-full h-[calc(100vh-9.5rem)] rounded-2xl overflow-hidden bg-slate-900/40 flex items-center justify-center border border-slate-700">
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
                setError("Permita acesso à câmera para iniciar a AR.");
              } finally {
                setRequesting(false);
              }
            }}
            disabled={points.length === 0 || requesting}
          >
            {points.length === 0 ? "Carregando pontos..." : requesting ? "Solicitando câmera..." : "Iniciar AR"}
          </button>
        </div>
      ) : (
        <div ref={containerRef} className="w-full h-[calc(100vh-9.5rem)] rounded-2xl overflow-hidden bg-transparent" />
      )}
      <CaptureOverlay show={overlay.show} text={overlay.text} points={overlay.points} />
    </div>
  );
}

const loadModel = (url: string) =>
  new Promise<any>((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(url, resolve, undefined, reject);
  });
