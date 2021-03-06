import {
  dashboardPageRegex,
  coursePageRegex,
  videoServicePageRegex,
  getMoodleBaseURL,
  courseResourcesPageRegex,
} from "../shared/helpers"
import { checkForMoodle } from "../shared/parser"

async function setDefaultMoodleURL(options) {
  if (!options.autoSetMoodleURL) return

  const baseURL = getMoodleBaseURL(location.href)
  browser.storage.local.set({
    options: {
      ...options,
      defaultMoodleURL: `${baseURL}/my`,
    },
  })
}

async function runDetector() {
  let page = ""

  const isMoodlePage = checkForMoodle()

  if (isMoodlePage) {
    const isDashboardPage = Boolean(location.href.match(dashboardPageRegex))
    const isCoursePage = Boolean(
      location.href.match(coursePageRegex) || location.href.match(courseResourcesPageRegex)
    )
    const isVideoServicePage = Boolean(location.href.match(videoServicePageRegex))

    if (isCoursePage) page = "course"
    if (isDashboardPage) page = "dashboard"
    if (isVideoServicePage) page = "videoservice"

    if (process.env.NODE_ENV === "debug") {
      const filename = location.href.split("/").pop()
      if (filename.includes("course")) page = "course"
      if (filename.includes("dashboard")) page = "dashboard"
    }
  }

  const isSupportedPage = page !== ""

  const {
    options,
    nUpdates,
    userHasRated,
    totalDownloadedFiles,
    rateHintLevel,
  } = await browser.storage.local.get()

  if (isSupportedPage) {
    browser.runtime.sendMessage({
      command: "set-icon",
    })

    setDefaultMoodleURL(options)

    browser.runtime.sendMessage({
      command: "execute-script",
      page,
    })
  }

  browser.runtime.onMessage.addListener(async message => {
    if (message.command === "get-state") {
      browser.runtime.sendMessage({
        command: "state",
        page,
        options,
        nUpdates,
        userHasRated,
        totalDownloadedFiles,
        rateHintLevel,
      })

      if (isSupportedPage) {
        browser.runtime.sendMessage({
          command: "page-data",
          page,
          HTMLString: document.querySelector("html").outerHTML,
        })
      }
    }

    if (message.command === "rate-click") {
      await browser.storage.local.set({
        userHasRated: true,
      })
      runDetector()
    }

    if (message.command === "avoid-rate-click") {
      await browser.storage.local.set({
        rateHintLevel: rateHintLevel + 1,
      })
      runDetector()
    }
  })
}

runDetector()
