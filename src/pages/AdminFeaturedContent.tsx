import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, Pause, Play, Trash2, Edit, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllFeaturedContent, useFeaturedContentMutations, FeaturedContentItem } from '@/hooks/useFeaturedContent';
import { toast } from 'sonner';

const MODULE_OPTIONS = [
  { value: 'deals', label: '🔥 Deals' },
  { value: 'trending', label: '📈 Trending' },
  { value: 'contextual', label: '🎯 Contextual' },
  { value: 'tips', label: '💡 Tips' },
];

const CONTENT_TYPES = [
  { value: 'deal', label: 'Deal' },
  { value: 'tip', label: 'Quick Tip' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'product', label: 'Featured Product' },
  { value: 'material', label: 'Featured Material' },
];

export default function AdminFeaturedContent() {
  const navigate = useNavigate();
  const { data: allContent, isLoading } = useAllFeaturedContent();
  const { createContent, updateContent, deleteContent, toggleActive } = useFeaturedContentMutations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FeaturedContentItem | null>(null);
  
  const [formData, setFormData] = useState({
    module_name: 'deals',
    content_type: 'deal' as 'deal' | 'tip' | 'announcement' | 'product' | 'material',
    title: '',
    description: '',
    image_url: '',
    cta_text: '',
    cta_url: '',
    entity_id: '',
    priority: 1,
    start_at: '',
    end_at: '',
  });
  
  const now = new Date();
  const activeContent = allContent?.filter(c => c.is_active && (!c.end_at || new Date(c.end_at) >= now)) || [];
  const scheduledContent = allContent?.filter(c => c.is_active && c.start_at && new Date(c.start_at) > now) || [];
  const inactiveContent = allContent?.filter(c => !c.is_active || (c.end_at && new Date(c.end_at) < now)) || [];
  
  const handleSubmit = async () => {
    try {
      if (editingItem) {
        await updateContent.mutateAsync({
          id: editingItem.id,
          ...formData,
          start_at: formData.start_at || null,
          end_at: formData.end_at || null,
        });
        toast.success('Content updated');
      } else {
        await createContent.mutateAsync({
          ...formData,
          is_active: true,
          start_at: formData.start_at || null,
          end_at: formData.end_at || null,
        });
        toast.success('Content created');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to save content');
    }
  };
  
  const handleEdit = (item: FeaturedContentItem) => {
    setEditingItem(item);
    setFormData({
      module_name: item.module_name,
      content_type: item.content_type as typeof formData.content_type,
      title: item.title,
      description: item.description || '',
      image_url: item.image_url || '',
      cta_text: item.cta_text || '',
      cta_url: item.cta_url || '',
      entity_id: item.entity_id || '',
      priority: item.priority,
      start_at: item.start_at?.split('T')[0] || '',
      end_at: item.end_at?.split('T')[0] || '',
    });
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this featured content?')) return;
    try {
      await deleteContent.mutateAsync(id);
      toast.success('Content deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };
  
  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await toggleActive.mutateAsync({ id, is_active: !isActive });
      toast.success(isActive ? 'Content paused' : 'Content activated');
    } catch {
      toast.error('Failed to toggle');
    }
  };
  
  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      module_name: 'deals',
      content_type: 'deal',
      title: '',
      description: '',
      image_url: '',
      cta_text: '',
      cta_url: '',
      entity_id: '',
      priority: 1,
      start_at: '',
      end_at: '',
    });
  };
  
  const ContentCard = ({ item, showStatus = false }: { item: FeaturedContentItem; showStatus?: boolean }) => (
    <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
      {item.image_url && (
        <img src={item.image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {showStatus && (
            <Badge variant={item.is_active ? 'default' : 'secondary'}>
              {item.is_active ? 'Active' : 'Paused'}
            </Badge>
          )}
          <Badge variant="outline">{item.content_type}</Badge>
        </div>
        <h4 className="font-medium truncate">{item.title}</h4>
        <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <span>Module: {item.module_name}</span>
          <span>•</span>
          <span>Priority: {item.priority}</span>
          {item.end_at && (
            <>
              <span>•</span>
              <span>Ends: {new Date(item.end_at).toLocaleDateString()}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => handleToggle(item.id, item.is_active)}>
          {item.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Featured Content</h1>
            <p className="text-muted-foreground">Curate and schedule content for sidebar modules</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Content
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Content' : 'Create Featured Content'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Target Module</Label>
                    <Select value={formData.module_name} onValueChange={(v) => setFormData(f => ({ ...f, module_name: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MODULE_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Content Type</Label>
                    <Select value={formData.content_type} onValueChange={(v) => setFormData(f => ({ ...f, content_type: v as typeof formData.content_type }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTENT_TYPES.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input 
                    value={formData.title} 
                    onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
                    placeholder="Featured content title"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                    placeholder="Brief description"
                    rows={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input 
                    value={formData.image_url} 
                    onChange={(e) => setFormData(f => ({ ...f, image_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CTA Text</Label>
                    <Input 
                      value={formData.cta_text} 
                      onChange={(e) => setFormData(f => ({ ...f, cta_text: e.target.value }))}
                      placeholder="Shop Now"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA URL</Label>
                    <Input 
                      value={formData.cta_url} 
                      onChange={(e) => setFormData(f => ({ ...f, cta_url: e.target.value }))}
                      placeholder="/deals?material=..."
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Input 
                      type="number"
                      min={1}
                      max={10}
                      value={formData.priority} 
                      onChange={(e) => setFormData(f => ({ ...f, priority: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input 
                      type="date"
                      value={formData.start_at} 
                      onChange={(e) => setFormData(f => ({ ...f, start_at: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input 
                      type="date"
                      value={formData.end_at} 
                      onChange={(e) => setFormData(f => ({ ...f, end_at: e.target.value }))}
                    />
                  </div>
                </div>
                
                <Button onClick={handleSubmit} className="w-full" disabled={!formData.title}>
                  {editingItem ? 'Update Content' : 'Create Content'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-8">
            {/* Active Now */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-green-500" />
                  Active Now ({activeContent.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeContent.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No active content</p>
                ) : (
                  activeContent.map(item => <ContentCard key={item.id} item={item} />)
                )}
              </CardContent>
            </Card>
            
            {/* Scheduled */}
            {scheduledContent.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-500" />
                    Scheduled ({scheduledContent.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {scheduledContent.map(item => <ContentCard key={item.id} item={item} />)}
                </CardContent>
              </Card>
            )}
            
            {/* Inactive/Expired */}
            {inactiveContent.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    Inactive/Expired ({inactiveContent.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {inactiveContent.map(item => <ContentCard key={item.id} item={item} showStatus />)}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
