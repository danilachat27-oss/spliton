/** Имитация сетевой задержки для mock-сервисов. TODO: убрать при подключении API. */
export async function adminMockDelay(ms = 280): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
