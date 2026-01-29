import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useListeningStore } from '@/stores/listeningStore'
import { useReadingStore } from '@/stores/readingStore'
import { useWritingStore } from '@/stores/writingStore'

export type ExamSection = 'listening' | 'reading' | 'writing'

const SECTION_ORDER: ExamSection[] = ['listening', 'reading', 'writing']

export function useExamNavigation() {
  const router = useRouter()
  const listeningStore = useListeningStore()
  const readingStore = useReadingStore()
  const writingStore = useWritingStore()

  // Check which sections are available based on test data
  const availableSections = computed<ExamSection[]>(() => {
    const sections: ExamSection[] = []

    if (listeningStore.test?.parts?.length) {
      sections.push('listening')
    }
    if (readingStore.test?.parts?.length) {
      sections.push('reading')
    }
    if (writingStore.test?.parts?.length) {
      sections.push('writing')
    }

    return sections
  })

  // Check if a specific section is available
  const isSectionAvailable = (section: ExamSection): boolean => {
    return availableSections.value.includes(section)
  }

  // Get the first available section
  const firstSection = computed<ExamSection | null>(() => {
    for (const section of SECTION_ORDER) {
      if (isSectionAvailable(section)) {
        return section
      }
    }
    return null
  })

  // Get the next section after the given one
  const getNextSection = (currentSection: ExamSection): ExamSection | null => {
    const currentIndex = SECTION_ORDER.indexOf(currentSection)

    for (let i = currentIndex + 1; i < SECTION_ORDER.length; i++) {
      const section = SECTION_ORDER[i]
      if (section && isSectionAvailable(section)) {
        return section
      }
    }

    return null
  }

  // Get the previous section before the given one
  const getPreviousSection = (currentSection: ExamSection): ExamSection | null => {
    const currentIndex = SECTION_ORDER.indexOf(currentSection)

    for (let i = currentIndex - 1; i >= 0; i--) {
      const section = SECTION_ORDER[i]
      if (section && isSectionAvailable(section)) {
        return section
      }
    }

    return null
  }

  // Navigate to next section or submission
  const goToNextSection = (currentSection: ExamSection) => {
    const nextSection = getNextSection(currentSection)

    if (nextSection) {
      router.push(`/${nextSection}`)
    } else {
      router.push('/submission')
    }
  }

  // Navigate to previous section
  const goToPreviousSection = (currentSection: ExamSection) => {
    const previousSection = getPreviousSection(currentSection)

    if (previousSection) {
      router.push(`/${previousSection}`)
    }
  }

  // Navigate to first available section
  const goToFirstSection = () => {
    if (firstSection.value) {
      router.push(`/${firstSection.value}`)
    } else {
      router.push('/submission')
    }
  }

  // Check if current section is the last one
  const isLastSection = (currentSection: ExamSection): boolean => {
    return getNextSection(currentSection) === null
  }

  // Check if current section is the first one
  const isFirstSection = (currentSection: ExamSection): boolean => {
    return getPreviousSection(currentSection) === null
  }

  return {
    availableSections,
    firstSection,
    isSectionAvailable,
    getNextSection,
    getPreviousSection,
    goToNextSection,
    goToPreviousSection,
    goToFirstSection,
    isLastSection,
    isFirstSection,
  }
}
