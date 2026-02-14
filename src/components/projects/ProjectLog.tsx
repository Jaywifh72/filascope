import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Image, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useProjectMutations, type ProjectLogEntry } from "@/hooks/useProject";

interface ProjectLogProps {
  projectId: string;
  entries: ProjectLogEntry[];
}

export function ProjectLog({ projectId, entries }: ProjectLogProps) {
  const { addLogEntry, deleteLogEntry } = useProjectMutations();
  const [showForm, setShowForm] = useState(false);
  const [entryText, setEntryText] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!entryText.trim()) return;
    addLogEntry.mutate(
      {
        project_id: projectId,
        entry_text: entryText.trim(),
        photos: photos.length > 0 ? photos : undefined,
      },
      {
        onSuccess: () => {
          setEntryText("");
          setPhotos([]);
          setShowForm(false);
        },
      }
    );
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 3 - photos.length);
    setPhotos([...photos, ...files]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Build Journal</h3>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-1" />
          Add Entry
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
          <Textarea
            placeholder="What's happening with the build?"
            value={entryText}
            onChange={(e) => setEntryText(e.target.value)}
            rows={3}
            autoFocus
          />

          {photos.length > 0 && (
            <div className="flex gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative">
                  <img
                    src={URL.createObjectURL(p)}
                    alt="Print photo preview"
                    className="w-16 h-16 object-cover rounded-md border border-border"
                  />
                  <button
                    onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              {photos.length < 3 && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Image className="w-4 h-4 mr-1" />
                    Photos ({photos.length}/3)
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEntryText(""); setPhotos([]); }}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!entryText.trim() || addLogEntry.isPending}
              >
                {addLogEntry.isPending ? "Saving..." : "Save Entry"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Entries */}
      {!entries.length && !showForm ? (
        <div className="text-center py-6 border border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground">
            Track your build progress with journal entries
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="p-3 rounded-lg border border-border">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{entry.entry_text}</p>

                  {entry.photos && entry.photos.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {entry.photos.map((photo) => (
                        <a
                          key={photo.id}
                          href={photo.photo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={photo.photo_url}
                            alt="Print photo"
                            className="w-20 h-20 object-cover rounded-md border border-border hover:opacity-80 transition-opacity"
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteLogEntry.mutate(entry.id)}
                >
                  <Trash2 className="w-3 h-3 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
