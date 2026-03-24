import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ARPoint, createPoint, getPoint, updatePoint } from "../services/pointsService";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import axios from "axios";
import { resolveAssetUrl } from "../utils/assetUrl";

const emptyPoint: Partial<ARPoint> = {
  name: "",
  slug: "",
  description: "",
  modelUrl: "",
  targetName: "",
  posX: 0,
  posY: 0,
  posZ: 0,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
  scaleX: 1,
  scaleY: 1,
  scaleZ: 1,
  points: 1,
  isActive: true,
};

function normalizeAndCenter(model: THREE.Object3D, camera: THREE.PerspectiveCamera) {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  if (size.lengthSq() === 0) return;

  model.position.sub(center);

  const maxDimension = Math.max(size.x, size.y, size.z);
  if (maxDimension > 0) {
    const fitHeightDistance = maxDimension / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    const fitWidthDistance = fitHeightDistance / camera.aspect;
    const distance = Math.max(fitHeightDistance, fitWidthDistance) * 1.4;
    camera.position.set(0, Math.max(size.y * 0.15, 0.6), distance);
    camera.lookAt(0, 0, 0);
  }
}

export default function AdminEditPoint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<Partial<ARPoint>>(emptyPoint);
  const [saveError, setSaveError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const isEdit = Boolean(id);

  useEffect(() => {
    if (id) getPoint(id).then(setData).catch(console.error);
  }, [id]);

  const handleChange = (key: keyof ARPoint, value: any) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    try {
      if (isEdit && id) {
        await updatePoint(id, data);
      } else {
        await createPoint(data);
      }
      navigate("/admin");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setSaveError(error.response?.data?.message || "N\u00e3o foi poss\u00edvel salvar este ponto.");
      } else {
        setSaveError("N\u00e3o foi poss\u00edvel salvar este ponto.");
      }
    }
  };

  // Preview 3D simples para ajustar pose antes de testar na AR
  useEffect(() => {
    const container = previewRef.current;
    const modelUrl = resolveAssetUrl(data.modelUrl);
    if (!container || !modelUrl) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    let frame: number;

    const width = container.clientWidth || 640;
    const height = 320;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 2.8);

    const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    scene.add(light);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(2, 3, 4);
    scene.add(dir);

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        normalizeAndCenter(model, camera!);
        model.position.set(data.posX ?? 0, data.posY ?? 0, data.posZ ?? 0);
        model.rotation.set(data.rotX ?? 0, data.rotY ?? 0, data.rotZ ?? 0);
        model.scale.set(data.scaleX ?? 1, data.scaleY ?? 1, data.scaleZ ?? 1);
        scene?.add(model);

        if (gltf.animations.length) {
          mixer = new THREE.AnimationMixer(model);
          const action = mixer.clipAction(gltf.animations[0]);
          action.play();
        }
      },
      undefined,
      (err) => {
        console.error("Erro carregando modelo para preview", err);
        const rawMessage = (err as any)?.message || "";
        if (rawMessage.includes("Unexpected token '<'")) {
          console.error("A URL do modelo retornou HTML em vez de GLTF/GLB:", modelUrl);
        }
      }
    );

    const clock = new THREE.Clock();
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      mixer?.update(delta);
      renderer?.render(scene!, camera!);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      mixer?.stopAllAction();
      renderer?.dispose();
      container.innerHTML = "";
    };
  }, [
    data.modelUrl,
    data.posX,
    data.posY,
    data.posZ,
    data.rotX,
    data.rotY,
    data.rotZ,
    data.scaleX,
    data.scaleY,
    data.scaleZ,
  ]);

  return (
    <div className="mt-8 glass p-6 rounded-3xl">
      <h1 className="text-2xl font-bold text-accent mb-4">
        {isEdit ? "Editar Ponto AR" : "Novo Ponto AR"}
      </h1>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
        <input className="input" placeholder="Nome" value={data.name || ""} onChange={(e) => handleChange("name", e.target.value)} />
        <input className="input" placeholder="Slug" value={data.slug || ""} onChange={(e) => handleChange("slug", e.target.value)} />
        <input className="input col-span-2" placeholder={"Descri\u00e7\u00e3o"} value={data.description || ""} onChange={(e) => handleChange("description", e.target.value)} />
        <input className="input" placeholder="Target name" value={data.targetName || ""} onChange={(e) => handleChange("targetName", e.target.value)} />
        <input className="input" placeholder="Target index" type="number" value={data.targetIndex ?? ""} onChange={(e) => handleChange("targetIndex", Number(e.target.value))} />
        <input className="input col-span-2" placeholder="URL do modelo (.glb)" value={data.modelUrl || ""} onChange={(e) => handleChange("modelUrl", e.target.value)} />
        <div className="col-span-2 grid grid-cols-3 gap-2 text-sm">
          {(["posX", "posY", "posZ", "rotX", "rotY", "rotZ", "scaleX", "scaleY", "scaleZ"] as const).map((key) => (
            <div key={key} className="flex flex-col">
              <label className="text-xs text-slate-400">{key}</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={(data as any)[key] ?? 0}
                onChange={(e) => handleChange(key, Number(e.target.value))}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <label>Pontos</label>
          <input type="number" className="input" value={data.points ?? 1} onChange={(e) => handleChange("points", Number(e.target.value))} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={data.isActive ?? true} onChange={(e) => handleChange("isActive", e.target.checked)} />
          <span>Ativo</span>
        </div>
        <div className="col-span-2">
          {saveError && <p className="mb-3 text-sm text-red-300">{saveError}</p>}
          <button className="bg-primary px-4 py-2 rounded text-white">{isEdit ? "Salvar" : "Criar"}</button>
        </div>
      </form>
      <p className="text-sm text-slate-400 mt-4">
        {"Dica: com a URL do modelo preenchida, use o preview abaixo para aproximar posi\u00e7\u00e3o/rota\u00e7\u00e3o/escala antes de testar no celular/AR."}
      </p>
      <div className="mt-3">
        <div ref={previewRef} className="w-full rounded-xl bg-slate-900/60 border border-slate-700 min-h-[320px] overflow-hidden" />
      </div>
    </div>
  );
}
