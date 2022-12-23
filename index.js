'use strict'

/**
 * @author Iago Beserra
 * @link https://linkedin.com/in/iago-beserra-71747317a/
 * @link https://github.com/iag0bezz
 * @description A simple morgan based response profiling and metrics
 * 
 * Thanks to the creators of Morgan (https://github.com/expressjs/morgan) 
 * for making the base available open-source
 */

const onHeaders = require('on-headers');
const onFinished = require('on-finished');

const MAPPER = {
  ':url': function getOriginalUrl (request, response) {
    return request.originalUrl || request.url;
  },
  ':method': function getHttpMethod (request, response) {
    return request.method;
  },
  ':status': function getHttpStatus (request, response) {
    return String(response.statusCode);
  },
  ':response-time': function getResponseTime (request, response) {
    if (!request._startedAt || !response._startedAt) {
      return;
    }

    const difference = 
      (response._startedAt[0] - request._startedAt[0]) * 1e3 +
      (response._startedAt[1] - request._startedAt[1]) * 1e-6
                                                                                                       
    return difference.toFixed(3);
  },
  ':total-time': function getTotalTime (request, response) {
    if (!request._startedAt || !request._currentTime) {
      return;
    }

    const elapsed = process.hrtime(request._startedAt);

    const difference = (elapsed[0 * 1e3]) + (elapsed[1] * 1e-6);

    return difference.toFixed(3);
  },
  ':http-version': function getHttpVersion (request, response) {
    return request.httpVersionMajor + '.' + request.httpVersionMinio
  },
  ':referrer': function getReferrer (request, response) {
    return request.headers.referer || request.headers.referrer;
  },
  ':remote-addr': function getRemoteAddr (request, response) {
    return request.ip ||
      request._remoteAddress ||
      (request.connection && request.connection.remoteAddress) ||
      undefined
  },
  ':user-agent': function getUserAgent (request, response) {
    return request.headers['user-agent'];
  },
  // I need to refactor this section
  ':res': function getResponse (request, response) {
    const request_header = request._request_header;

    if (!request_header) {
      return;
    }

    const header = response.getHeader(request_header);

    if (!header) {
      return '';
    }

    return Array.isArray(header) ? header.join(',') : header
  },
  ':req': function getRequest (request, response) {
    const request_header = request._request_header;

    if (!request_header) {
      return;
    }

    const header = request.getHeader(request_header);

    if (!header) {
      return '';
    }

    return Array.isArray(header) ? header.join(',') : header
  }
}

const DEFAULT_FORMAT = ':method :url :status :res[content-length] - :response-time ms';
const DEFAULT_BLACKLIST = ['/favicon.ico']

/**
 * The main express middleware for response profiling
 * 
 * @param { format, blacklist, output, callback } options 
 * @returns Express function middleware
 */
function metriker(options) {
  const opts = options || {};

  const format = opts.format || DEFAULT_FORMAT;
  const blacklist = opts.blacklist || DEFAULT_BLACKLIST;

  const output = opts.output || process.stdout;
  const callback = opts.callback || undefined;

  return function logger(request, response, next) {
    if (blacklist.includes(request.originalUrl || request.url)) {
      return;
    }

    request._startedAt = undefined;
    request._currentTime = undefined;
    
    response._startedAt = undefined;
    response._currentTime = undefined;

    initializeTimer.call(request);

    function log() { 
      let text = format;

      let callbackObject = {};

      format.split(' ').forEach(
        (value) => {
          const [name, fn] = parseRequest(value, request);

          if (fn) {
            callbackObject[name] = fn(request, response);

            text = text.replace(value, fn(request, response));
          }
        }
      )

      if (callback) {
        callback(callbackObject);
      }
      
      output.write(text + '\n')
    }

    onHeaders(response, initializeTimer);
    onFinished(request, log);

    next();
  }
}

function parseRequest (value, request) {
  if (/:([-\w]{2,})(?:\[([^\]]+)\])?/g.test(value)) {
    const exec = /:([-\w]{2,})(?:\[([^\]]+)\])?/g.exec(value);

    const fn = MAPPER[`:${exec[1]}`];

    if (exec[2] !== undefined) {
      request._request_header = exec[2];
    }

    return [value, fn];
  }

  return [value, undefined];
}

function initializeTimer() {
  this._startedAt = process.hrtime();
  this._currentTime = new Date();
}

module.exports = metriker;