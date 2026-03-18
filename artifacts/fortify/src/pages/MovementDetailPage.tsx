import { useRoute, Link } from 'wouter';
import { useMovement } from '@/hooks/use-movements';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MovementDetailPage() {
  const [, params] = useRoute('/movements/:id');
  const { data: movement, isLoading } = useMovement(params?.id || '');

  if (isLoading) return <div className="p-6 text-center mt-20">Loading...</div>;
  if (!movement) return <div className="p-6 text-center mt-20 text-destructive">Movement not found</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/movements">
          <Button variant="ghost" size="icon" className="rounded-full bg-card">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-display text-white tracking-wide">{movement.name}</h1>
          <div className="flex gap-2 mt-1">
            <Badge className="bg-primary/20 text-primary hover:bg-primary/30">{movement.category}</Badge>
            <Badge variant="outline">{movement.difficulty}</Badge>
          </div>
        </div>
      </div>

      {movement.youtube_embed_id && (
        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black aspect-video relative">
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${movement.youtube_embed_id}?rel=0`}
            title={movement.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      )}

      {movement.description && (
        <p className="text-muted-foreground text-sm leading-relaxed bg-card/40 p-4 rounded-xl border border-white/5">
          {movement.description}
        </p>
      )}

      {movement.cue_points && movement.cue_points.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-display text-2xl text-white">Execution Cues</h3>
          <Card className="bg-transparent border-white/10">
            <CardContent className="p-0">
              <ul className="divide-y divide-white/5">
                {movement.cue_points.map((cue, idx) => (
                  <li key={idx} className="p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-sm text-white/90">{cue}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}

      <div className="grid grid-cols-2 gap-4">
        {movement.primary_muscles && (
          <section className="bg-card p-4 rounded-xl border border-white/5">
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">Primary Muscles</h4>
            <div className="flex flex-wrap gap-1">
              {movement.primary_muscles.map(m => (
                <Badge key={m} variant="secondary" className="text-[10px] bg-white/10 text-white capitalize">{m.replace('_', ' ')}</Badge>
              ))}
            </div>
          </section>
        )}
        
        {movement.secondary_muscles && (
          <section className="bg-card p-4 rounded-xl border border-white/5">
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">Secondary Muscles</h4>
            <div className="flex flex-wrap gap-1">
              {movement.secondary_muscles.map(m => (
                <Badge key={m} variant="outline" className="text-[10px] capitalize">{m.replace('_', ' ')}</Badge>
              ))}
            </div>
          </section>
        )}
      </div>

    </motion.div>
  );
}
