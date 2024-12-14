import { EventEmitter } from 'events'
import byline from 'byline'

class JsonEventStreamer extends EventEmitter {
  constructor (stream, {
    argumentsProperty = 'arguments',
    emitLocalEvents = false,
    eventProperty = 'event',
    ignoreNonJson = false
  } = {}) {
    super()

    this.argumentsProperty = argumentsProperty
    this.emitLocalEvents = emitLocalEvents
    this.eventProperty = eventProperty
    this.stream = stream
    this.ignoreNonJson = ignoreNonJson

    this.allListeners = new Set()

    byline(this.stream).on('data', data => this._handle(data))
  }

  _handle (data) {
    let message

    try {
      message = JSON.parse(data.toString())
    } catch (err) {
      if (!this.ignoreNonJson) {
        super.emit('error', err)
      }

      return
    }

    this._handleAll(message)

    if (!message[this.argumentsProperty]) {
      super.emit(message[this.eventProperty])
    } else {
      super.emit(message[this.eventProperty], ...message[this.argumentsProperty])
    }
  }

  _handleAll (message) {
    for (const listener of this.allListeners) {
      if (!message[this.argumentsProperty]) {
        listener(message[this.eventProperty])
      } else {
        listener(message[this.eventProperty], ...message[this.argumentsProperty])
      }
    }
  }

  emit (event, ...args) {
    const message = { [this.eventProperty]: event }

    if (args.length > 0) {
      message[this.argumentsProperty] = args
    }

    this.stream.write(`${JSON.stringify(message)}\n`)

    if (this.emitLocalEvents) {
      this._handleAll(message)

      super.emit(event, ...args)
    }
  }

  onAll (listener) {
    this.allListeners.add(listener)
  }

  removeAllListener (listener) {
    this.allListeners.delete(listener)
  }
}

export default JsonEventStreamer
