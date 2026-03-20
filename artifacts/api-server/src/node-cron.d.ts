declare module "node-cron" {
  export function schedule(
    cronExpression: string,
    callback: () => void,
  ): { stop: () => void };
  const cron: { schedule: typeof schedule };
  export default cron;
}
