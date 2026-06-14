import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SimplePage({ title, description, items = [] }: { title: string; description: string; items?: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item} className="rounded-3xl border border-[var(--border)] bg-white/55 p-4 text-sm font-bold dark:bg-white/5">
            {item}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
