import { coursePageRegex } from "./helpers"

export function checkForMoodle() {
  // Check for unique moodle DOM element
  return Boolean(document.querySelector("section#region-main"))
}

export function parseCourseNameFromCoursePage(document) {
  const header = document.querySelector(".page-header-headings")
  if (header && header.children.length > 0) {
    return header.children[0].textContent
  }

  const shortcutNode = document.querySelector("a[aria-current='page']")
  if (shortcutNode) {
    if (shortcutNode.title !== "") {
      return shortcutNode.title
    }

    if (shortcutNode.textContent !== "") {
      return shortcutNode.textContent
    }
  }

  return "Unknown Course"
}

export function parseCourseShortcut(document) {
  const shortcutNode = document.querySelector("a[aria-current='page']")
  if (shortcutNode) {
    if (shortcutNode.textContent !== "") {
      return shortcutNode.textContent
    }
  }

  return "Unknown Shortcut"
}

export function parseCourseNameFromCard(cardNode) {
  return cardNode
    .querySelector(".coursename")
    .innerText.split("\n")
    .pop()
}

export function parseCourseLink(htmlString) {
  const match = htmlString.match(coursePageRegex)
  return match ? match[0] : htmlString
}

export function getQuerySelector(type) {
  const baseURL = "" // location.hostname.replace(/\./g, "\\.")
  const fileSelector = `[href*=${baseURL}\\/mod\\/resource]`
  const folderSelector = `[href*=${baseURL}\\/mod\\/folder]`
  const pluginFileSelector = `[href*=${baseURL}\\/pluginfile]`
  const videoSelector = `video source[src*=${baseURL}\\/pluginfile]`
  const audioSelector = `audio source[src*=${baseURL}\\/pluginfile]`
  const imageSelector = `img[src*=${baseURL}\\/pluginfile]`
  // Any link with /mod/xxx except /mod/resource and /mod/folder
  const activityQuerySelector = `[href*=${baseURL}\\/mod\\/]:not(${fileSelector}):not(${folderSelector})`

  let selector = null
  switch (type) {
    case "file":
      selector = fileSelector
      break
    case "folder":
      selector = folderSelector
      break
    case "pluginfile":
      selector = [pluginFileSelector, videoSelector, audioSelector].join(",")
      break
    case "activity":
      selector = activityQuerySelector
      break
    case "video":
      selector = videoSelector
      break
    case "audio":
      selector = audioSelector
      break
    case "image":
      selector = imageSelector
      break
    case "media":
      selector = [videoSelector, audioSelector].join(",")
      break
    default:
      break
  }

  selector = `${selector}:not(.helplinkpopup)`
  return selector
}

export function parseURLFromNode(node, type) {
  const aTag = node.querySelector(getQuerySelector(type))
  if (aTag) {
    return aTag.href
  }

  if (node.tagName === "A") {
    return node.href
  }

  if (type === "pluginfile") {
    // Videos are also pluginfiles but have a different selector
    const sourceTag = node.querySelector(getQuerySelector("media"))
    if (sourceTag) {
      return sourceTag.src
    }

    if (node.tagName === "SOURCE") {
      return node.src
    }
  }

  return ""
}

export function parseFileNameFromNode(node) {
  // Files or Folders
  if (node.querySelector(".instancename")) {
    return node.querySelector(".instancename").firstChild.textContent.trim()
  }

  // PluginFiles
  if (node.querySelector(".fp-filename")) {
    return node.querySelector(".fp-filename").textContent.trim()
  }

  if (node.textContent !== "") {
    return node.textContent.trim()
  }

  return "Unknown Filename"
}

export function parseFileNameFromPluginFileURL(url) {
  let fileName = url
    .split("/")
    .pop() // Take last part of URL
    .split("?")
    .shift() // Take everything before query parameters

  fileName = decodeURIComponent(fileName)

  const specialCharacters = {
    "%21": "!",
    "%23": "#",
    "%24": "$",
    "%25": "%",
    "%26": "&",
    "%27": "'",
    "%28": "(",
    "%29": ")",
    "%2A": "*",
    "%2B": "+",
    "%2C": ",",
    "%2F": "/",
    "%3A": ":",
    "%3B": ";",
    "%3D": "=",
    "%3F": "?",
    "%40": "@",
    "%5B": "[",
    "%5D": "]",
  }

  for (const percentChar of Object.keys(specialCharacters)) {
    fileName = fileName.replace(percentChar, specialCharacters[percentChar])
  }

  return fileName
}

export function parseActivityNameFromNode(node) {
  if (node.querySelector(".instancename")) {
    const activityName = node.querySelector(".instancename").firstChild.textContent
    if (activityName !== "") {
      return activityName.trim()
    }
  }

  return "Unknown Activity"
}

export function parseActivityTypeFromNode(node) {
  const modtypeClassResult = node.className.match(/modtype.*(?= )/gi)
  if (modtypeClassResult) {
    const activityType = modtypeClassResult[0].split("_")[1]
    if (activityType) {
      return activityType
    }
  }

  if (node.querySelector(".accesshide")) {
    const activityType = node.querySelector(".accesshide").firstChild.textContent.trim()
    if (activityType !== "") return activityType
  }

  return "Unkown Activity Type"
}

export function parseSectionName(node) {
  let section = node.closest("li[id^='section-']")
  if (section && section.attributes["aria-label"]) {
    return section.attributes["aria-label"].value.trim()
  }

  section = node.closest("div[id^='section-']")
  if (section && section.attributes["aria-labelledby"]) {
    const labelledBy = section.attributes["aria-labelledby"].value
    const label = document.getElementById(labelledBy)
    if (label) {
      return label.textContent.trim()
    }
  }

  return ""
}

export function getDownloadButton(node) {
  return node.querySelector("form[action$=\\/mod\\/folder\\/download_folder\\.php]")
}

export function getDownloadIdTag(node) {
  return node.querySelector("input[name='id']")
}
