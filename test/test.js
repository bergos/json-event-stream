import { deepStrictEqual, strictEqual } from 'node:assert'
import { setTimeout } from 'node:timers/promises'
import { describe, it } from 'mocha'
import { Duplex, PassThrough } from 'readable-stream'
import decode from 'stream-chunks/decode.js'
import JsonEventStreamer from '../index.js'

describe('JsonEventStreamer', () => {
  it('should be a constructor', () => {
    strictEqual(typeof JsonEventStreamer, 'function')
  })

  it('should emit an error if the content is not valid JSON', async () => {
    let error
    const stream = new PassThrough()
    const events = new JsonEventStreamer(stream)

    events.on('error', err => {
      error = err
    })

    stream.write('test\n')

    await setTimeout(1)

    strictEqual(error instanceof Error, true)
    strictEqual(/is not valid JSON/.test(error.message), true)
  })

  describe('.emit', () => {
    it('should be a method', () => {
      const stream = new PassThrough()
      const events = new JsonEventStreamer(stream)

      strictEqual(typeof events.emit, 'function')
    })

    it('should write the given event to the stream', async () => {
      const stream = new PassThrough()
      const dummy = new PassThrough()
      const events = new JsonEventStreamer(Duplex.from({ writable: stream, readable: dummy }))

      events.emit('example')
      stream.end()

      const content = await decode(stream)

      deepStrictEqual(JSON.parse(content), { event: 'example' })
    })

    it('should write the given arguments to the stream', async () => {
      const expected = [1, 'a', { b: 'c' }]
      const stream = new PassThrough()
      const dummy = new PassThrough()
      const events = new JsonEventStreamer(Duplex.from({ writable: stream, readable: dummy }))

      events.emit('example', ...expected)
      stream.end()

      const content = await decode(stream)

      deepStrictEqual(JSON.parse(content), { event: 'example', arguments: expected })
    })

    it('should support custom event property', async () => {
      const stream = new PassThrough()
      const dummy = new PassThrough()
      const events = new JsonEventStreamer(Duplex.from({ writable: stream, readable: dummy }), {
        eventProperty: 'name'
      })

      events.emit('example')
      stream.end()

      const content = await decode(stream)

      deepStrictEqual(JSON.parse(content), { name: 'example' })
    })

    it('should support custom arguments properties', async () => {
      const expected = [1, 'a', { b: 'c' }]
      const stream = new PassThrough()
      const dummy = new PassThrough()
      const events = new JsonEventStreamer(Duplex.from({ writable: stream, readable: dummy }), {
        argumentsProperty: 'args'
      })

      events.emit('example', ...expected)
      stream.end()

      const content = await decode(stream)

      deepStrictEqual(JSON.parse(content), { event: 'example', args: expected })
    })

    it('should not emit the event locally', async () => {
      let called = false
      const stream = new PassThrough()
      const dummy = new PassThrough()
      const events = new JsonEventStreamer(Duplex.from({ writable: stream, readable: dummy }))

      events.on('example', () => {
        called = true
      })

      events.emit('example')
      stream.end()

      strictEqual(called, false)
    })

    it('should emit the event locally if emitLocalEvents is true', async () => {
      let called = false
      const stream = new PassThrough()
      const dummy = new PassThrough()
      const events = new JsonEventStreamer(Duplex.from({ writable: stream, readable: dummy }), { emitLocalEvents: true })

      events.on('example', () => {
        called = true
      })

      events.emit('example')
      stream.end()

      strictEqual(called, true)
    })
  })

  describe('.on', () => {
    it('should be a method', () => {
      const stream = new PassThrough()
      const events = new JsonEventStreamer(stream)

      strictEqual(typeof events.on, 'function')
    })

    it('should call the given callback function if a message with a matching event shows up', async () => {
      let called
      const stream = new PassThrough()
      const events = new JsonEventStreamer(stream)

      events.on('example', () => {
        called = true
      })

      stream.write(`${JSON.stringify({ event: 'example' })}\n`)

      await setTimeout(1)

      strictEqual(called, true)
    })

    it('should only call the callback for the given event', async () => {
      let called = false
      const stream = new PassThrough()
      const events = new JsonEventStreamer(stream)

      events.on('example', () => {
        called = true
      })

      stream.write(`${JSON.stringify({ event: 'other' })}\n`)

      await setTimeout(1)

      strictEqual(called, false)
    })

    it('should forward the sent arguments', async () => {
      let args
      const expected = [1, 'a', { b: 'c' }]
      const stream = new PassThrough()
      const events = new JsonEventStreamer(stream)

      events.on('example', (...a) => {
        args = a
      })

      stream.write(`${JSON.stringify({ event: 'example', arguments: expected })}\n`)

      await setTimeout(1)

      deepStrictEqual(args, expected)
    })

    it('should support custom event property', async () => {
      let called
      const stream = new PassThrough()
      const events = new JsonEventStreamer(stream, {
        eventProperty: 'name'
      })

      events.on('example', () => {
        called = true
      })

      stream.write(`${JSON.stringify({ name: 'example' })}\n`)

      await setTimeout(1)

      strictEqual(called, true)
    })

    it('should support custom arguments properties', async () => {
      let args
      const expected = [1, 'a', { b: 'c' }]
      const stream = new PassThrough()
      const events = new JsonEventStreamer(stream, {
        argumentsProperty: 'args'
      })

      events.on('example', (...a) => {
        args = a
      })

      stream.write(`${JSON.stringify({ event: 'example', args: expected })}\n`)

      await setTimeout(1)

      deepStrictEqual(args, expected)
    })
  })

  describe('.onAll', () => {
    it('should be a method', () => {
      const stream = new PassThrough()
      const events = new JsonEventStreamer(stream)

      strictEqual(typeof events.onAll, 'function')
    })

    it('should call the given callback function if a message with an event shows up', async () => {
      let called
      const stream = new PassThrough()
      const events = new JsonEventStreamer(stream)

      events.onAll(() => {
        called = true
      })

      stream.write(`${JSON.stringify({ event: 'example' })}\n`)

      await setTimeout(1)

      strictEqual(called, true)
    })

    it('should forward the event name', async () => {
      let eventName
      const stream = new PassThrough()
      const events = new JsonEventStreamer(stream)

      events.onAll(event => {
        eventName = event
      })

      stream.write(`${JSON.stringify({ event: 'example' })}\n`)

      await setTimeout(1)

      strictEqual(eventName, 'example')
    })

    it('should forward the sent arguments', async () => {
      let args
      const expected = [1, 'a', { b: 'c' }]
      const stream = new PassThrough()
      const events = new JsonEventStreamer(stream)

      events.onAll((event, ...a) => {
        args = a
      })

      stream.write(`${JSON.stringify({ event: 'example', arguments: expected })}\n`)

      await setTimeout(1)

      deepStrictEqual(args, expected)
    })

    it('should support custom event property', async () => {
      let eventName
      const stream = new PassThrough()
      const events = new JsonEventStreamer(stream, {
        eventProperty: 'name'
      })

      events.onAll(event => {
        eventName = event
      })

      stream.write(`${JSON.stringify({ name: 'example' })}\n`)

      await setTimeout(1)

      strictEqual(eventName, 'example')
    })

    it('should support custom arguments properties', async () => {
      let args = null
      const expected = [1, 'a', { b: 'c' }]
      const stream = new PassThrough()
      const events = new JsonEventStreamer(stream, {
        argumentsProperty: 'args'
      })

      events.onAll((event, ...a) => {
        args = a
      })

      stream.write(`${JSON.stringify({ event: 'example', args: expected })}\n`)

      await setTimeout(1)

      deepStrictEqual(args, expected)
    })

    it('should not be called on local events', async () => {
      let called = false
      const stream = new Duplex({
        read (size) {},
        write (chunk, encoding, callback) {
          callback()
        }
      })
      const events = new JsonEventStreamer(stream)

      events.onAll(() => {
        called = true
      })

      events.emit('example')

      await setTimeout(1)

      strictEqual(called, false)
    })

    it('should be called on local events if emitLocalEvents is true', async () => {
      let called = false
      const stream = new Duplex({
        read (size) {},
        write (chunk, encoding, callback) {
          callback()
        }
      })
      const events = new JsonEventStreamer(stream, { emitLocalEvents: true })

      events.onAll(() => {
        called = true
      })

      events.emit('example')

      await setTimeout(1)

      strictEqual(called, true)
    })
  })

  describe('.removeAllListener', () => {
    it('should be a method', () => {
      const stream = new PassThrough()
      const events = new JsonEventStreamer(stream)

      strictEqual(typeof events.removeAllListener, 'function')
    })

    it('should not call the given callback function after it was removed', async () => {
      let called = false
      const stream = new PassThrough()
      const events = new JsonEventStreamer(stream)
      const callback = () => {
        called = true
      }

      events.onAll(callback)
      events.removeAllListener(callback)

      stream.write(`${JSON.stringify({ event: 'example' })}\n`)

      await setTimeout(1)

      strictEqual(called, false)
    })
  })
})
