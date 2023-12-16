const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');

async function main() {
  const provider = new WsProvider('wss://rpc.polkadot.io')
  const api = await ApiPromise.create({ provider })

  const keyring = new Keyring({ type: 'sr25519' })
  const account = keyring.addFromUri('助记词')

  const remark = '{"p":"pol-20","op":"mint","tick":"dots","amt":"1000"}'

  for (let i = 0; i < 1000; i++) {
    // Await the completion of each transaction
    await new Promise(async (resolve, reject) => {
      await api.tx.system
        .remarkWithEvent(remark)
        .signAndSend(account, ({ status, dispatchError }) => {
          if (status.isInBlock || status.isFinalized) {
            console.log(
              `Transaction ${i + 1} included at blockHash ${
                status.asInBlock || status.asFinalized
              }`
            )
            resolve()
          } else if (dispatchError) {
            if (dispatchError.isModule) {
              // for module errors, we have the section indexed, lookup
              const decoded = api.registry.findMetaError(dispatchError.asModule)
              const { docs, name, section } = decoded
              console.log(`${section}.${name}: ${docs.join(' ')}`)
            } else {
              // Other, CannotLookup, BadOrigin, no extra info
              console.log(dispatchError.toString())
            }
            reject()
          }
        })
    }).catch((e) => {
      console.error(`Error in transaction ${i + 1}:`, e)
      // Optional: add a delay on error to prevent immediate retry
      return new Promise((resolve) => setTimeout(resolve, 5000)) // 5 second delay
    })

    // Add a delay between transactions
    await new Promise((resolve) => setTimeout(resolve, 500)) // 0.5 second delay
  }
}

main().catch(console.error)

