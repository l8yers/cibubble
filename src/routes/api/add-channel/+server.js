import { json } from '@sveltejs/kit';
export async function POST() {
  return json({ status: "add-channel endpoint is alive" });
}
