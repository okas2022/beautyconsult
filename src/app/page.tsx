import { redirect } from "next/navigation";

/** 메인 진입점 → 트렌드 라운지 */
export default function HomePage() {
  redirect("/trend");
}
