import { Code, Globe, Mail, MapPin, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const skills = ["TypeScript", "React", "Node.js", "Express", "Prisma", "Tailwind CSS", "Vite", "Vitest"];

/** Public profile page for the app's author, linked from the navbar. */
export const AboutPage = () => {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="h-8 w-8 text-muted-foreground" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Asanul Haque</h1>
          <p className="text-muted-foreground">Software Engineer</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed">
          <p>
            Hi, I&apos;m Asanul — a software engineer who enjoys building practical, well-tested web applications.
            This Multi-rate Pricing Calculator is one of my projects: a full-stack app for creating pricing documents
            with per-line tax rates, discounts, and finalized reports.
          </p>
          <p>
            I care about clean code, precise money math, and simple user interfaces that get out of the way. When
            I&apos;m not coding, I&apos;m usually learning something new or refining side projects like this one.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => {
              return (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" aria-hidden />
            <a href="mailto:asanulhaquekiron@gmail.com" className="hover:underline">
              asanulhaquekiron@gmail.com
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" aria-hidden />
            <a href="https://asanulhaque.com" target="_blank" rel="noreferrer" className="hover:underline">
              asanulhaque.com
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-muted-foreground" aria-hidden />
            <a
              href="https://github.com/neel-asanulhaquekiron"
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              github.com/neel-asanulhaquekiron
            </a>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />
            <span>Bangladesh</span>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">
            Want to collaborate or have feedback on this project? Feel free to reach out by email.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
