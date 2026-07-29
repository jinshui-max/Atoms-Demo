import type { Metadata } from "next";
import { ShareViewer } from "./share-viewer";

export const metadata: Metadata = {
  title: "分享预览 · Atoms-Demo",
  description: "打开他人分享的 Atoms Demo 应用快照",
};

export default function SharePage() {
  return <ShareViewer />;
}
