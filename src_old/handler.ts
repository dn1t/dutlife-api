export type HandlerFunction = (req: Request) => Response | Promise<Response>;

function Handler(fn: HandlerFunction) {
  return fn;
}

export default Handler;
