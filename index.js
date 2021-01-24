#!/usr/bin/env node

/**
 * https://everettjf.github.io/2019/10/15/remoboard-web/
 *
 */

(async () => {
  const [, self, url] = process.argv

  if (!/^https?:\/\/.+/.test(url)) {
    console.log(`Usage: node ${self} url`)
    return
  }

  const { URL } = require('url')

  const { protocol, search: Arguments, host, origin, pathname } = new URL(url)

  const WebSocket = require('ws')

  const wsUrl = `${protocol === 'https:' ? 'wss' : 'ws'}://${host}${pathname.replace(/\/$/, '')}/ws`

  // console.log(`Connecting To Websocket Server: ${wsUrl}`)

  const ws = new WebSocket(wsUrl)

  ws.isAlive = false

  const exit = (code = 0) => {
    ws.terminate()
    process.exit(code)
  }

  const kSeparater = '##rkb-1l0v3y0u3000##'

  const sendMessage = (type, message = Buffer.alloc(0)) => {
    // console.log('Send:', type, message.toString('hex').toUpperCase().replace(/(..)/g, '$1 '))

    const prefix = Buffer.from(`${type}${kSeparater}`, 'ascii')

    ws.send(Buffer.concat([prefix, message]))
  }

  ws.on('open', function open () {
    ws.isAlive = true

    setInterval(() => {
      if (ws.isAlive === false) {
        console.log('🤔 Connect Lost ...')
        exit(1)
        return
      }

      ws.isAlive = false
      ws.ping()
    }, 1000)

    process.stdin.setRawMode(true)
    process.stdin.resume()

    console.log('🌈 Ready for typing :)')

    // Send hello to Remote Keyboard Server
    ws.send('hello')

    const keys = {
      '\u007F': 'input-delete', // 0x7f === 127 === backspace
      '\u001B[A': 'move-up',
      '\u001B[B': 'move-down',
      '\u001B[C': 'move-right',
      '\u001B[D': 'move-left',
    }

    process.stdin.on('data', (buf) => {
      // console.log('Data:', JSON.stringify(buf), buf.toString('hex').toUpperCase().replace(/(..)/g, '$1 '))

      const cmd = keys[buf.toString()]

      if (cmd) {
        sendMessage(cmd)
        return
      }

      if (buf.length === 1) {
        if (buf[0] === 0x0D) { // fix \r to \n
          buf[0] = 0x0A
        }
      }

      sendMessage('input', buf);
    })
  })

  ws.on('close', () => {
    console.log('🤔 Connect Closed ...')
    exit(0)
  })

  ws.on('error', (e) => {
    console.error('🤔 WebSocket Error:', e)
    exit(1)
  })

  //ws.on('message', function incoming (data) {
    //return
  //})

  // ws.on('ping', (buf) => {
  //   console.log(new Date(), 'ping')
  // })

  ws.on('pong', (buf) => {
    ws.isAlive = true
  })
})()

// vim: set expandtab tabstop=2 shiftwidth=2 tabstop=2 :
