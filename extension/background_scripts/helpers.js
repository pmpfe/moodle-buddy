import { isFirefox, getActiveTab } from "../shared/helpers"

const isDev = process.env.NODE_ENV !== "production"

async function sendToLambda(path, body) {
  const { options, browserId } = await browser.storage.local.get(["options", "browserId"])

  if (options.disableInteractionTracking) {
    // console.log("Moodle Buddy Tracking disabled!")
    if (path === "/event") {
      const eventExceptions = ["install", "update"]
      if (!eventExceptions.includes(body.event)) {
        return
      }
    }

    // Feeback and logs are always sent
    const pathExceptions = ["/feedback", "/log"]
    if (!pathExceptions.includes(path)) {
      return
    }
  }

  const requestBody = {
    ...body,
    browser: isFirefox() ? "firefox" : "chrome",
    browserId,
    dev: isDev,
  }

  if (isDev) {
    console.log(requestBody)
  }

  if (process.env.API_URL) {
    try {
      fetch(`${process.env.API_URL}${path}`, {
        method: "POST",
        headers: {
          "User-Agent": navigator.userAgent,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })
    } catch (error) {
      console.error(error)
      setTimeout(() => {
        sendLog({ errorMessage: error.message })
      }, 5000)
    }
  }
}

export async function sendEvent(event, saveURL, eventData) {
  let url = ""
  if (saveURL) {
    const activeTab = await getActiveTab()
    url = activeTab.url
  }

  sendToLambda("/event", { event, url, eventData })
}

export async function sendDownloadData(data) {
  sendToLambda("/download", data)
}

export async function sendPageData(HTMLString, page) {
  if (!isDev) {
    sendToLambda("/page", { HTMLString, page })
  }
}

export async function sendFeedback(subject, content) {
  sendEvent("feedback", false)
  sendToLambda("/feedback", { subject, content })
}

export async function sendLog(log) {
  const { errorMessage } = log

  const skipMessages = ["Failed to fetch", "Download canceled by the user"]
  if (errorMessage && skipMessages.includes(errorMessage)) {
    return
  }

  sendToLambda("/log", { log })
}

export function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    // eslint-disable-next-line no-bitwise
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  )
}

browser.browserAction.setBadgeBackgroundColor({ color: "#555555" })
browser.browserAction.setBadgeText({ text: "" })

export async function setIcon(tabId) {
  if (tabId) {
    browser.browserAction.setIcon({
      path: {
        16: "/icons/16.png",
        32: "/icons/32.png",
        48: "/icons/48.png",
      },
      tabId,
    })
  }
}

export async function setBadgeText(text, tabId) {
  if (tabId) {
    // If tabId is given reset global and only set the local one
    await browser.browserAction.setBadgeText({ text: "" }) // Reset global badge text
    await browser.browserAction.setBadgeText({ text: `${text}`, tabId }) // Set local badge text
    await browser.storage.local.set({ nUpdates: 0 }) // Reset background update counter
  } else {
    await browser.browserAction.setBadgeText({ text: `${text}` })
  }
}
