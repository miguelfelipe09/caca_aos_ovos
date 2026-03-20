declare module "mind-ar/dist/mindar-image-three.prod.js" {
  import { Scene, Camera, WebGLRenderer, Group } from "three";

  export class MindARThree {
    constructor(options: { container: HTMLElement; imageTargetSrc: string });
    renderer: WebGLRenderer;
    scene: Scene;
    camera: Camera;
    start(): Promise<void>;
    stop(): void;
    addAnchor(targetIndex: number): {
      group: Group;
      onTargetLost?: () => void;
      onTargetFound?: () => void;
    };
  }
}
