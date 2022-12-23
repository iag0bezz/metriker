import http = require('http');

type Handler<Request extends http.IncomingMessage, Response extends http.ServerResponse> = (req: Request, response: Response, callback: (err?: Error) => void) => void;

declare namespace metriker {
  interface Metriker<Request extends http.IncomingMessage, Response extends http.ServerResponse> {
    (options?: Options<Request, Response>): Handler<Request, Response>;
  }

  interface Options<Request extends http.IncomingMessage, Response extends http.ServerResponse> {
    format?: string | undefined;
    blacklist?: string[];
    output?: StreamOptions | undefined;
    callback?: (data: any) => void;
  }
}

export = metriker;