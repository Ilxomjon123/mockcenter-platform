import { defineStore } from 'pinia'
import type { ReadingState, Passage, Question } from '@/types/reading'
import type { ExamTestRaw, PartRaw, QuestionRaw } from '@/types/test'

const STORAGE_KEY = 'ielts_reading_state'

const loadFromStorage = (): ReadingState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Error loading reading state:', error)
  }
  return null
}

const saveToStorage = (state: ReadingState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Error saving reading state:', error)
  }
}

export const useReadingStore = defineStore('reading', {
  state: (): ReadingState => {
    const saved = loadFromStorage()
    return (
      saved || {
        currentPart: 1,
        passages: [
          {
            id: 1,
            title: 'The life and work of Marie Curie',
            content: `Marie Curie was a remarkable scientist who has ever lived. Born Maria Sklodowska in Poland in 1867, she is famous for her work on radioactivity, and was twice a winner of the Nobel Prize. With her husband, Pierre Curie, and Henri Becquerel, she was awarded the 1903 Nobel Prize for Physics, and was then sole winner of the 1911 Nobel Prize for Chemistry. She was the first woman to win a Nobel Prize.

From childhood, Marie was remarkable for her prodigious memory, and at the age of 16 won a gold medal on completion of her secondary education. Because her father lost his savings through bad investment, she then had to take work as a teacher. From her earnings she was able to finance her sister Bronia's medical studies in Paris, on the understanding that Bronia would, in turn, later help her to get an education.

In 1891 this promise was fulfilled and Marie went to Paris and began to study at the Sorbonne (the University of Paris). She often worked far into the night and lived on little more than bread and butter and tea. She came first in the examination in the physical sciences in 1893, and in 1894 was placed second in the examination in mathematical sciences. It was not until the spring of that year that she was introduced to Pierre Curie.

Their marriage in 1895 marked the start of a partnership that was soon to achieve results of world significance. Following Henri Becquerel's discovery in 1896 of a new phenomenon, which Marie later called 'radioactivity', Marie Curie decided to find out if the radioactivity discovered in uranium was to be found in other elements. She discovered that this was true for thorium.

Turning her attention to minerals, she found her interest drawn to pitchblende, a mineral whose radioactivity, superior to that of pure uranium, could be explained only by the presence in the ore of small quantities of an unknown substance of very high activity. Pierre Curie joined her in the work that she had undertaken to resolve this problem, and that led to the discovery of the new elements, polonium and radium. While Pierre Curie devoted himself chiefly to the physical study of the new radiations, Marie Curie struggled to obtain pure radium in the metallic state. This was achieved with the help of the chemist André-Louis Debierne, one of Pierre Curie's pupils. Based on the results of this research, Marie Curie received her Doctorate of Science, and in 1903 Marie and Pierre shared with Becquerel the Nobel Prize for Physics for the discovery of radioactivity.

The births of Marie's two daughters, Irène and Ève, in 1897 and 1904 failed to interrupt her scientific work. She was appointed lecturer in physics at the École Normale Supérieure for girls in Sèvres, France (1900), and introduced a method of teaching based on experimental demonstrations. In December 1904 she was appointed chief assistant in the laboratory directed by Pierre Curie.

The sudden death of her husband in 1906 was a bitter blow to Marie Curie, but was also a turning point in her career: henceforth she was to devote all her energy to completing alone the scientific work that they had undertaken. On May 13, 1906, she was appointed to the professorship that had been left vacant on her husband's death, becoming the first woman to teach at the Sorbonne. In 1911 she was awarded the Nobel Prize for Chemistry for the isolation of pure radium.

During World War I, Marie Curie, with the help of her daughter Irène, devoted herself to the development of the use of X-radiography, including the mobile units which came to be known as 'Little Curies', used for the treatment of wounded soldiers. In 1918 the Radium Institute, whose staff Irène had joined, began to operate in earnest, and became a centre for nuclear physics and chemistry. Marie Curie, now at the highest point of her fame and, from 1922, a member of the Academy of Medicine, researched the chemistry of radioactive substances and their medical applications.

In 1921, accompanied by her two daughters, Marie made a triumphant journey to the United States to raise funds for research on radium. Women there presented her with a gram of radium for her campaign. Marie also gave lectures in Belgium, Brazil, Spain and Czechoslovakia and, in addition, had the satisfaction of seeing the development of the Curie Foundation in Paris, and the inauguration in 1932 in Warsaw of the Radium Institute, which she had founded in collaboration with her sister Bronia.

One of Marie Curie's outstanding achievements was to have understood the need to accumulate intense radioactive sources, not only to treat illness but also to maintain an abundant supply for research. The existence in Paris at the Radium Institute of a stock of 1.5 grams of radium made a decisive contribution to the success of the experiments undertaken in the years around 1930. This work prepared the way for the discovery of the neutron by Sir James Chadwick and, above all, for the discovery in 1934 by Irène and Frédéric Joliot-Curie of artificial radioactivity. A few months after this discovery, Marie Curie died as a result of leukaemia caused by exposure to radiation. She had often carried test tubes containing radioactive isotopes in her pocket, remarking on the pretty blue-green light that they gave off.

Her contribution to physics had been immense, not only in her own work, the importance of which had been demonstrated by the award of two Nobel Prizes, but because of her influence on subsequent generations of nuclear physicists and chemists.`,
            questions: [
              {
                id: 1,
                type: 'true-false-not-given',
                text: "Marie Curie's husband was a joint winner of both Marie's Nobel Prizes.",
                options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              },
              {
                id: 2,
                type: 'true-false-not-given',
                text: 'Marie became interested in science when she was a child.',
                options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              },
              {
                id: 3,
                type: 'true-false-not-given',
                text: "Marie was able to attend the Sorbonne because of her sister's financial contribution.",
                options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              },
              {
                id: 4,
                type: 'true-false-not-given',
                text: 'Marie stopped doing research for several years when her children were born.',
                options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              },
              {
                id: 5,
                type: 'true-false-not-given',
                text: 'Marie took over the teaching position her husband had held.',
                options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              },
              {
                id: 6,
                type: 'true-false-not-given',
                text: "Marie's sister Bronia studied the medical uses of radioactivity.",
                options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              },
            ],
          },
          {
            id: 2,
            title: 'The Physics of Traffic Behavior',
            content: `Some years ago, when several theoretical physicists, principally Dirk Helbing and Boris Kerner of Stuttgart, Germany, began to study traffic, other physicists laughed. It was a little like reducing the study of the cosmos to an analysis of a single star. But today the science of traffic flow has grown into an independent field. Around the world, physicists and traffic engineers are studying traffic patterns and their causes to reduce traffic flow just as similar to states - gas molecules, for instance, below a speed threshold - traffic flows freely. Above that speed, it moves more slowly.

The strangest thing that came out of these equations, however, was the implication that congestion can arise completely spontaneously, no external cause is necessary. Vehicles can be flowing freely along, at a density still well below the road can handle, and then suddenly, as if freeze, traffic jams into a slow-moving state. Under the right conditions a small event like a car braking a little suddenly can set off a chain reaction that leads to a complete traffic jam. What the physicists discovered was that in the world of traffic as well as in the world of molecules, the probability of unusual but intuitively rare events can affect analysis suggested such spontaneous breakdowns in traffic flow probably occur quite frequently on highways.

14

The strangest thing that came out of these equations, however, was the implication that congestion can arise completely spontaneously, no external cause is necessary. Vehicles can be flowing freely along, at a density still well below the road can handle, and then suddenly, as if freeze, traffic jams into a slow-moving state. Under the right conditions a small event like a car braking a little suddenly can set off a chain reaction that leads to a complete traffic jam. What the physicists discovered was that in the world of traffic as well as in the world of molecules, the probability of unusual but intuitively rare events can affect analysis suggested such spontaneous breakdowns in traffic flow probably occur quite frequently on highways.

Dramatic effects can result from small changes in traffic just as in nature
Though a decidedly interesting discovery, this created striking similarities to the phenomenon popularised as 'chaos theory'. This phenomenon refers to the fact that in a complex system even tiny differences in the initial conditions can lead to radically different outcomes. Consequently, tiny variations in one part of a complex system can give huge but unpredictable errors. This type of dramatic change from one state to another is similar to what happens when a chemical substance changes from a vapor to a liquid and then to a solid. However, this is a general phenomenon: under the right circumstances such a sudden change could condense into water droplets. However if the vapor encounters a solid surface, even something as small as a speck of dust, condensation can take place and the transition from vapor to liquid finally occurs. Helbing and Kerner saw traffic as a complex system in which tiny, very modest changes in some variable can have huge effects on other variables. In an article entitled 'Traffic, Crowds, and Swarms', Helbing suggested a way to avoid highly nonlinear breakdowns in the flow of traffic could ultimately require implementing the radical idea that has been suggested from time to time: directly regulating the speed and spacing of individual cars along a highway with central computers and sensors that communicate with each car's on-board controls.

15

The physicists have challenged proposals to set a maximum capacity for vehicles on highways. They argue that it may not be enough simply to limit the rate at which vehicles are allowed to enter a highway. Instead, it may be necessary to time each vehicle's entry onto a highway precisely to coincide with a temporary drop in the density of vehicles along the road. The aim of doing this would be to avoid the small fluctuations in speed that can trigger a breakdown in the flow of traffic. They further suggest that preventing breakdowns in the flow of traffic could ultimately require implementing the radical idea that has been suggested from time to time: directly regulating the speed and spacing of individual cars along a highway with central computers and sensors that communicate with each car's on-board controls.

16

However, research into traffic control is generally centered in civil engineering departments and here the theories of the physicists have been greeted with some scepticism. Civil engineers favour a practical approach to problems and believe traffic congestion is caused by poor road design, accidents and congestion at freeway entries and exits. They argue that building more roads, creating better signal timing in coordinated light sequences and constructing more efficient parking and transit systems can achieve improvements in traffic flow.

Engineers questioned how well the physicists' theoretical results match the traffic in the real world. Indeed, some engineering researchers questioned whether rationale raised theory interpretations are needed at all, since at the end of the day improvements to the real world traffic management systems remain the main goal. Several civil engineers said that the existing infrastructure with each car's engine and brakes controls.

17

James Banks, a professor of civil and environmental engineering at San Diego State University in the US, suggested that a sudden slowdown in traffic may have less to do with chaos theory than with driver psychology. As traffic gets heavier and the car passing lanes gets more crowded, aggressive drivers move to the slower lanes to try to pass, which also tends to even out the speed between lanes. He also felt that another leveling force in which a driver in a fast lane brakes a step to maintain a safe driving distance between themselves and the car ahead, could push drivers on the slower lanes to slow down, so traffic jams create a ripple effect that spreads through traffic like dominoes. Traffic might take to read more quickly. Consequently, as a road becomes congested, the faster moving traffic is the first to slow down.`,
            questions: [
              {
                id: 14,
                type: 'matching',
                text: 'The text has four sections. Choose the correct heading for each section and move it into the gap.',
                options: [
                  'How a maths experiment actually reduced traffic congestion',
                  'How a concept from one field of study was applied in another',
                  'A lack of investment in driver training',
                  'Areas of doubt and disagreement between experts',
                  'How different countries have dealt with traffic congestion',
                  'The impact of driver behavior on traffic speed',
                  'A proposal to take control away from the driver',
                ],
              },
              {
                id: 18,
                type: 'multiple-choice',
                text: 'Which TWO options describe what the writer is doing in section two?',
                options: [
                  "explaining Helbing and Kerner's theory",
                  "clarifying Helbing and Kerner's conclusions about traffic behaviour",
                  'showing how weather and temperature can change traffic flow',
                  'drawing parallels between traffic and other natural phenomena',
                  'giving examples of different potential causes of congestion',
                ],
              },
              {
                id: 20,
                type: 'multiple-choice',
                text: "Which TWO statements reflect civil engineers' opinions of the physicists' theories?",
                options: [
                  'They fail to take into account road maintenance.',
                  'They may have little to do with everyday traffic behaviour.',
                  'They are inconsistent with chaos theory.',
                  'They do not really describe anything new.',
                  'They can easily be disproved.',
                ],
              },
              {
                id: 22,
                type: 'multiple-choice',
                text: 'Which TWO of the following options express the purpose of the text?',
                options: [
                  'to change the behaviour of vehicle drivers',
                  'to discuss contrasting approaches to understanding congestion',
                  'to recommend a practical rather than a theoretical approach to traffic control',
                  'to inform drivers of future changes in traffic control methods',
                  'to give details of some of the behaviors shown by traffic',
                ],
              },
            ],
          },
          {
            id: 3,
            title: 'Plain English',
            content: `'Plain' is a familiar term in the field of natural products to which 'language' can be put. It is nearly conceivable how books, or language in general, may best be written. The highly idiomatic nature of what 'Plain English' actually refers to best, can be argued upon.

Plain English campaign was launched on a hot summer's day in 1979, in a blaze of publicity, just outside British Government's Whitehall. The aim was to launch against official forms, legal documents, and forms which gave problems to anyone reading them. This message clearly came from a survey of over 1,000 members of the public, which had been conducted just over the summer of 1978, and in which 80% said there were many documents or forms they couldn't comprehend.

From its modest beginnings, the campaign has been remarkably successful. It has grown to become an international consultancy with offices in the UK, USA, Australia, and New Zealand. The campaign also runs a lucrative approval service – granting commercial and government publications the honour of receiving the 'Crystal Mark' if they meet minimum standards. A network of accredited Plain English trainers operate worldwide, using its official methods and training programmes.

Today the Plain English campaign continues to urge translation of as much 'legalese' as possible into plain, straightforward English for those affected. Some of this work consists of rewriting legal documents into plain English that most people would understand. Consequently it is said that legal documents shouldn't be complicated or perplexing documents; even if they're complicated they should be made as clear as possible for the parties involved.

Plain' is already one sensual concept that everybody more or less agrees upon, more contentious. It's contention is essentially this: A clear message is one that its target readership can understand on first reading. For people wishing to read plain English in their native language, this concept becomes much more specific.

Some of the campaign's goals have been successful, but some might consider its effect limited. The campaign admits that its approach has not been replicated everywhere. Indeed, those who have tried to bring plain English campaigns to other countries have met with a mixed reception. In contrast, in some countries there are laws that oblige public bodies to use plain language.

Government bodies find these developments very disturbing. They know that the approach they take could be challenged legally. In 2010, president Barack Obama signed the Plain Writing Act, requiring all US federal agencies to use clear language that the public could understand. A set of minimum compliance writing standards came out of this. No major legal action was taken to challenge the existing document.

Objective detractors do appear to object on the grounds that with certain languages, text complexity is seen as important for particular purposes. For example, complex phrasing of complex issues in legal documents is necessary for precision. Some people have questioned whether making documents too plain would lead to oversimplification.

Before making decisions or conduct different forms from tools made strictly according to clear principle, some work needs to be done. Evidence of effectiveness based on improved completion and comprehension rates has to be considered, but there has been little actual research into whether forms and documents that are made to conform with 'plain English' standards are actually more effective, useful or clear.

Sentence construction in several different kinds texts have dictated how just after complex issues are to be tackled in principle. Some of the complex features are actually important to a particular field, and would lose something by substituting much smoother documents.

Similarly, professional research around different fields texts have dictated how issues are or have always shown that complex discourse is not as complicated or as awkward in one sense as we might first assume when reviewing a document. Therefore by seeking to present plain forms.

Complex structures used in written different forms books have strictly shown that text complexity in scientific literature, art writing, even in different forms does not necessarily impact text understanding negatively but often contributes to a specific function. Therefore better structured reading over simpler reading doesn't always suggest better understanding has been achieved.`,
            questions: [
              {
                id: 27,
                type: 'true-false-not-given',
                text: 'Choose TRUE if the statement agrees with the information given in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
                options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              },
              {
                id: 28,
                type: 'true-false-not-given',
                text: 'All campaigns found it difficult to be in government in Alberta.',
                options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              },
              {
                id: 29,
                type: 'true-false-not-given',
                text: 'A lot of all information did not reveal that the official of the campaign than was imagined.',
                options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              },
              {
                id: 30,
                type: 'true-false-not-given',
                text: 'In the B.U.S.A, awards are given to anybody who have produced materials that are easy to understand.',
                options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              },
              {
                id: 31,
                type: 'true-false-not-given',
                text: 'Use of clear language on documents can be automatically carried out.',
                options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              },
              {
                id: 32,
                type: 'true-false-not-given',
                text: 'The sentence of election to use simpler wording can challenge to portfolios other books to introduce.',
                options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              },
              {
                id: 33,
                type: 'true-false-not-given',
                text: 'Regular details are used in language used in the courts.',
                options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              },
              {
                id: 34,
                type: 'fill-blank',
                text: 'Complete the summary. Write ONE WORD ONLY from the text for each answer. For computer, the may or question points are from a biological perspective. This scientific advantage of plain language has no been in the case of documents.',
                options: [],
              },
              {
                id: 35,
                type: 'fill-blank',
                text: 'Grammar, plain complex language they possessed in their biological system to which they were meant to understand a situation, or it means the physical presentation could affect directly the benefit of others often make changes in their course if it a slight advantage.',
                options: [],
              },
              {
                id: 36,
                type: 'fill-blank',
                text: 'Made use and data Curie developed X-radiography which was used as a medical technique for:',
                options: [],
              },
              {
                id: 37,
                type: 'fill-blank',
                text: 'Marie Curie saw the importance of collecting radioactive material both for research and for cases of:',
                options: [],
              },
              {
                id: 38,
                type: 'fill-blank',
                text: 'The radioactive material decided in Paris contributed to the discoveries in the 1930s of the:',
                options: [],
              },
              {
                id: 39,
                type: 'fill-blank',
                text: 'During her research, Marie Curie was exposed to radiation and as a result suffered from:',
                options: [],
              },
              {
                id: 40,
                type: 'fill-blank',
                text: "Leaded, however fact's human objectives to the use of Plan English revealed their truth in were meant a biological perspective.",
                options: [],
              },
            ],
          },
        ],
        answers: {},
      }
    )
  },

  getters: {
    currentPassage: (state) => {
      return state.passages.find((p) => p.id === state.currentPart)
    },
  },

  actions: {
    setTest(test: ExamTestRaw): void {
      const reading = test.reading
      const parts = [...reading.parts].sort((a, b) => a.order - b.order)
      const mapQuestion = (q: QuestionRaw): Question => {
        let type: Question['type'] = 'fill-blank'
        if (q.type === 'multiple_choice') type = 'multiple-choice'
        if (q.type === 'matching') type = 'matching'
        const text = q.name || q.title || ''
        const options = Array.isArray(q.options) ? (q.options as string[]) : undefined
        return { id: q.id, type, text, options }
      }
      const passages: Passage[] = parts.map((p: PartRaw) => ({
        id: p.order,
        title: p.title,
        content: p.content || '',
        questions: [...p.questions].sort((a, b) => a.order - b.order).map(mapQuestion),
      }))
      this.currentPart = passages[0]?.id || 1
      ;(this as any).passages = passages
      ;(this as any).answers = {}
    },
    setPart(part: number): void {
      this.currentPart = part
      saveToStorage(this.$state)
    },

    updateAnswer(questionId: number, answer: string | number): void {
      this.answers[questionId] = answer
      saveToStorage(this.$state)
    },

    clearReading(): void {
      this.currentPart = 1
      this.answers = {}
      localStorage.removeItem(STORAGE_KEY)
    },
  },
})
