import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, GraduationCap, Code, Brain } from "lucide-react"
import Link from "next/link"

const curatedContent = [
  {
    id: "cs50",
    title: "CS50: Introduction to Computer Science",
    description: "Harvard's famous computer science course",
    icon: Code,
    category: "Computer Science",
  },
  {
    id: "mit-brain",
    title: "MIT 9.13: The Human Brain",
    description: "Introduction to the human brain and neuroscience",
    icon: Brain,
    category: "Neuroscience",
  },
  {
    id: "genetics",
    title: "The Genetic Code and Translation",
    description: "DNA translates to protein sequences",
    icon: GraduationCap,
    category: "Biology",
  },
]

export default function ExplorePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Explore</h1>
        <p className="text-muted-foreground mt-2">
          Discover curated learning content
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {curatedContent.map((content) => {
          const Icon = content.icon
          return (
            <Card key={content.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2 mb-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle>{content.title}</CardTitle>
                </div>
                <CardDescription>{content.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {content.category}
                  </span>
                  <Button size="sm" variant="outline">
                    Add to Workspace
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

