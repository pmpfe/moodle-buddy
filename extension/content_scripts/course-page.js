import { parseCourseLink } from "../shared/parser"
import { updateIconFromCourses } from "../shared/helpers"
import Course from "../models/Course"

const courseLink = parseCourseLink(location.href)
const course = new Course(courseLink, document)

// browser.storage.local.clear()

// Initial scan
course.scan().then(() => {
  updateIconFromCourses(course)
})

browser.runtime.onMessage.addListener(async message => {
  if (message.command === "scan") {
    await course.scan()
    updateIconFromCourses(course)

    browser.runtime.sendMessage({
      command: "scan-result",
      resourceNodes: course.resourceNodes,
      activityNodes: course.activityNodes,
      ...course.resourceCounts,
      ...course.activityCounts,
    })
    return
  }

  if (message.command === "mark-as-seen") {
    await course.updateStoredResources()
    await course.updateStoredActivities()
    await course.scan()
    updateIconFromCourses(course)
    return
  }

  if (message.command === "update-activities") {
    await course.updateStoredActivities()
    await course.scan()
    updateIconFromCourses(course)
    return
  }

  if (message.command === "crawl") {
    const { options } = message

    const downloadNodes = course.resourceNodes.filter(n => {
      if (options.skipFiles && n.isFile) return false
      if (options.skipFolders && n.isFolder) return false
      if (options.onlyNewResources && !n.isNewResource) return false

      return true
    })

    browser.runtime.sendMessage({
      command: "download",
      resources: downloadNodes,
      courseName: course.name,
      courseShortcut: course.shortcut,
      options,
    })

    await course.scan()
    updateIconFromCourses(course)
  }
})