"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Zap, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import type { Quiz } from "@/lib/db/supabase"

interface Question {
  question: string
  type: "multiple_choice" | "short_answer"
  options?: string[]
  correctAnswer: string
  explanation?: string
}

interface QuizInterfaceProps {
  workspaceId: string
  existingQuizzes: Quiz[]
  contentId?: string
}

export default function QuizInterface({ workspaceId, existingQuizzes, contentId }: QuizInterfaceProps) {
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [generating, setGenerating] = useState(false)
  const [taking, setTaking] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [score, setScore] = useState<number | null>(null)
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [numQuestions, setNumQuestions] = useState(5)

  const handleAnswerChange = useCallback((questionIdx: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionIdx]: value }))
  }, [])

  const handleGenerateQuiz = async () => {
    setGenerating(true)
    try {
      const response = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          contentId,
          difficulty,
          numQuestions,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate quiz")
      }

      setSelectedQuiz(data.quiz)
      setTaking(true)
      setSubmitted(false)
      setAnswers({})
      setResults([])
      setScore(null)
    } catch (error: any) {
      alert(error.message || "Failed to generate quiz")
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmitQuiz = async () => {
    if (!selectedQuiz) return

    const answersArray = selectedQuiz.questions.map((_, idx) => answers[idx] || "")

    setSubmitting(true)
    try {
      const response = await fetch(`/api/quiz/${selectedQuiz.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersArray }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit quiz")
      }

      setResults(data.results)
      setScore(data.score)
      setSubmitted(true)
    } catch (error: any) {
      alert(error.message || "Failed to submit quiz")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted && results.length > 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Quiz Results</span>
              <span className="text-2xl font-bold text-primary">{score}%</span>
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          {results.map((result, idx) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">Question {idx + 1}</CardTitle>
                  {result.isCorrect ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )}
                </div>
                <CardDescription>{result.question}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Your answer:</p>
                  <p className={cn(
                    "text-sm",
                    result.isCorrect ? "text-green-600" : "text-red-600"
                  )}>
                    {result.userAnswer || "(No answer)"}
                  </p>
                </div>
                {!result.isCorrect && (
                  <div>
                    <p className="text-sm font-medium">Correct answer:</p>
                    <p className="text-sm text-green-600">{result.correctAnswer}</p>
                  </div>
                )}
                {result.explanation && (
                  <div>
                    <p className="text-sm font-medium">Explanation:</p>
                    <p className="text-sm text-muted-foreground">{result.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex space-x-4">
          <Button onClick={() => {
            setSubmitted(false)
            setTaking(false)
            setSelectedQuiz(null)
            setAnswers({})
            setResults([])
            setScore(null)
          }}>
            Take Another Quiz
          </Button>
          <Button variant="outline" onClick={() => {
            setSubmitted(false)
            setAnswers({})
            setResults([])
            setScore(null)
          }}>
            Retry This Quiz
          </Button>
        </div>
      </div>
    )
  }

  if (taking && selectedQuiz) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Quiz - {selectedQuiz.difficulty}</CardTitle>
            <CardDescription>
              Answer all questions and submit when ready
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="space-y-6">
          {selectedQuiz.questions.map((question, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-lg">Question {idx + 1}</CardTitle>
                <CardDescription>{question.question}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {question.options?.map((option: string, optIdx: number) => (
                    <div
                      key={optIdx}
                      onClick={() => handleAnswerChange(idx, option)}
                      className={cn(
                        "flex items-center space-x-2 p-3 rounded-md border cursor-pointer hover:bg-accent select-none",
                        answers[idx] === option && "bg-primary/10 border-primary"
                      )}
                    >
                      <input
                        type="radio"
                        name={`question-${idx}`}
                        value={option}
                        checked={answers[idx] === option}
                        onChange={(e) => {
                          // Prevent this from firing - we handle it in the div onClick
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        className="sr-only"
                        readOnly
                      />
                      <span className="flex-1">{option}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => {
              setTaking(false)
              setSelectedQuiz(null)
              setAnswers({})
            }}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitQuiz}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Grading your quiz...
              </>
            ) : (
              "Submit Quiz"
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Generate New Quiz</span>
          </CardTitle>
          <CardDescription>
            Create a personalized quiz based on your workspace content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Difficulty</Label>
              <Select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </Select>
            </div>
            <div>
              <Label>Number of Questions</Label>
              <Input
                type="number"
                min={3}
                max={20}
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value) || 5)}
              />
            </div>
          </div>
          <Button
            onClick={handleGenerateQuiz}
            disabled={generating}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Generate Quiz
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {existingQuizzes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {existingQuizzes.map((quiz) => (
                <Button
                  key={quiz.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedQuiz(quiz)
                    setTaking(true)
                    setSubmitted(false)
                    setAnswers({})
                    setResults([])
                    setScore(null)
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>
                      {quiz.difficulty} - {quiz.questions.length} questions
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(quiz.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

