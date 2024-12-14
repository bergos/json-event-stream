# json-event-stream

[![build status](https://img.shields.io/github/actions/workflow/status/bergos/json-event-stream/test.yaml?branch=master)](https://github.com/bergos/json-event-stream/actions/workflows/test.yaml)
[![npm version](https://img.shields.io/npm/v/json-event-stream.svg)](https://www.npmjs.com/package/json-event-stream)

`json-event-stream` is an npm package that bridges JSON objects and Node.js events, facilitating bi-directional communication.
It processes newline-delimited JSON (NDJSON) streams to emit events for each parsed object and outputs JSON objects for every emitted event.

This package is particularly useful for scenarios like transmitting events over WebSockets or communicating with IoT devices via serial ports.

## Install

```bash
npm install --save json-event-stream 
```

## Usage

The package exports the `JsonEventStream` class, which extends Node.js's `EventEmitter`.

### Constructor

The constructor takes a Duplex stream for the NDJSON data as its first argument.
Optionally, a configuration object can be provided as the second argument:

```javascript
new JsonEventStream(stream, {
  argumentsProperty,
  emitLocalEvents,
  eventProperty,
  ignoreNonJson
})
```

#### Configuration Options

- `argumentsProperty`: Specifies the property name for event arguments in JSON objects (default: `arguments`).
- `emitLocalEvents`: When set to true, events are emitted locally in addition to being written to the stream (default: `false`).
- `eventProperty`: Specifies the property name for event names in JSON objects (default: `event`).
- `ignoreNonJson`: If true, non-JSON inputs are ignored instead of throwing an error (default: `false`).

## Example

Below is a basic example demonstrating how to use the package:

```javascript
// import the JSON Event Stream package
import JsonEventStream from 'json-event-stream'

// the stream must be a Duplex stream capable of reading and writing NDJSON
const stream = ... // your NDJSON Duplex stream setup here
const events = new JSONEventStream(stream)

// add an event listener for 'from-json' events
// the event JSON objects must follow the format: {"event": "from-json", "arguments": ["test"]}
events.on('from-json', (...args) => {
  console.log(`from-json: ${JSON.stringify(args)}`)
})

// emit a 'from-event' event
// this will generate a JSON object with the format: {"event":"from-event","arguments":["test"]}
events.emit('from-event', 'test')
```

Fully working examples can be found in the `examples` folder.
