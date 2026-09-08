import React, { useState, useEffect } from 'react';
import { 
  Heart, MessageSquare, Plus, Upload, Filter, Sparkles, 
  CheckCircle2, XCircle, Shield, Send, Image as ImageIcon 
} from 'lucide-react';
import { api } from '../utils/api';

export default function GalleryPage({ currentUser }) {
  const [photos, setPhotos] = useState([]);
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [categories, setCategories] = useState(['All', 'Cultural Fest', 'Dance', 'Music', 'Arts & Creative', 'Teachers Day', 'Freshers']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('public'); // 'public' | 'moderation'

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [eventName, setEventName] = useState('');
  const [categoryInput, setCategoryInput] = useState('Cultural Fest');
  const [captionInput, setCaptionInput] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Active photo comment drawer
  const [activeCommentPhoto, setActiveCommentPhoto] = useState(null);
  const [newCommentText, setNewCommentText] = useState('');

  const isModerator = currentUser && ['Student Organizer', 'Faculty Coordinator', 'HOD/Admin', 'Principal/Final Admin'].includes(currentUser.role_name);

  useEffect(() => {
    loadGallery();
  }, [selectedCategory, activeTab]);

  const loadGallery = async () => {
    try {
      setLoading(true);
      if (activeTab === 'public') {
        const data = await api.getGallery(selectedCategory);
        setPhotos(data);
      } else if (activeTab === 'moderation' && isModerator) {
        const pending = await api.getPendingGallery();
        setPendingPhotos(pending);
      }
    } catch (err) {
      console.error('Error loading gallery:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.uploadGalleryPhoto({
        event_name: eventName,
        category: categoryInput,
        caption: captionInput,
        image_url: imageUrlInput || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800'
      });
      setUploadSuccess('Memory uploaded! Sent for Organizer/Admin approval.');
      setTimeout(() => {
        setUploadSuccess('');
        setShowUploadModal(false);
        setEventName('');
        setCaptionInput('');
        setImageUrlInput('');
      }, 1800);
    } catch (err) {
      alert(err.message || 'Failed to upload photo');
    }
  };

  const handleLikeToggle = async (photoId) => {
    try {
      await api.toggleLike(photoId);
      loadGallery();
    } catch (err) {
      console.error('Like toggle failed:', err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!activeCommentPhoto || !newCommentText.trim()) return;
    try {
      const created = await api.postComment(activeCommentPhoto.id, newCommentText);
      setActiveCommentPhoto(prev => ({
        ...prev,
        comments: [...(prev.comments || []), created]
      }));
      setNewCommentText('');
      loadGallery();
    } catch (err) {
      console.error('Comment failed:', err);
    }
  };

  const handleModerateStatus = async (photoId, status) => {
    try {
      await api.updateGalleryStatus(photoId, status);
      setPendingPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-card p-8 sm:p-12 border border-slate-800 bg-gradient-to-r from-pink-950/40 via-slate-900 to-indigo-950/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-bold">
              <Heart className="w-4 h-4 fill-pink-400" /> College Celebration Memories & Gallery
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white">
              Campus Culture Vault
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Explore past college celebrations, festivals, concert nights, and campus events. Share your own favorite memories for organizer approval!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-pink-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Memory Photo</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher for Public vs Moderator Pending Queue */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('public')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'public'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              Public Memories
            </button>
            {isModerator && (
              <button
                onClick={() => setActiveTab('moderation')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'moderation'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Approval Queue ({pendingPhotos.length})</span>
              </button>
            )}
          </div>

          {activeTab === 'public' && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-slate-800 text-pink-400 border border-pink-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Moderation Pending Queue Tab */}
      {activeTab === 'moderation' && isModerator && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" /> Pending Photo Submissions Approval
          </h2>

          {pendingPhotos.length === 0 ? (
            <div className="glass-card p-8 rounded-2xl text-center text-slate-400 text-xs">
              No photo submissions pending moderation!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingPhotos.map(photo => (
                <div key={photo.id} className="glass-card rounded-2xl overflow-hidden border border-slate-800 space-y-3 p-4">
                  <div className="h-48 rounded-xl overflow-hidden relative">
                    <img src={photo.image_url} alt={photo.event_name} className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/90 text-pink-400 text-[10px] font-bold">
                      {photo.category}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{photo.event_name}</h4>
                    <p className="text-xs text-slate-300 mt-1 italic">"{photo.caption}"</p>
                    <p className="text-[10px] text-slate-400 mt-2">By: {photo.uploader_name} ({photo.uploader_email})</p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleModerateStatus(photo.id, 'APPROVED')}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() => handleModerateStatus(photo.id, 'REJECTED')}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Public Gallery Grid */}
      {activeTab === 'public' && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-16 text-slate-400 animate-pulse">Loading gallery memories...</div>
          ) : photos.length === 0 ? (
            <div className="glass-card p-12 rounded-3xl text-center text-slate-400 text-sm">
              No memory photos found for this category. Be the first to share!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map(photo => (
                <div key={photo.id} className="glass-card rounded-3xl overflow-hidden border border-slate-800 flex flex-col justify-between group hover:border-pink-500/40 transition-all duration-300">
                  <div>
                    {/* Image Container */}
                    <div className="relative h-60 overflow-hidden">
                      <img src={photo.image_url} alt={photo.event_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-pink-400 border border-slate-700">
                        {photo.category}
                      </div>
                    </div>

                    {/* Card Description */}
                    <div className="p-5 space-y-2">
                      <h3 className="font-bold text-white text-base">{photo.event_name}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">{photo.caption}</p>
                      <div className="text-[10px] text-slate-500 flex items-center justify-between pt-2">
                        <span>Shared by {photo.uploader_name}</span>
                        <span>{new Date(photo.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Comment Drawer trigger */}
                  <div className="px-5 py-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <button
                      onClick={() => handleLikeToggle(photo.id)}
                      className="flex items-center gap-1.5 text-slate-300 hover:text-pink-400 font-semibold transition-colors"
                    >
                      <Heart className="w-4 h-4 text-pink-500 fill-pink-500/20" />
                      <span>{photo.likes_count || 0} Likes</span>
                    </button>

                    <button
                      onClick={() => setActiveCommentPhoto(photo)}
                      className="flex items-center gap-1.5 text-slate-300 hover:text-indigo-400 font-semibold transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 text-indigo-400" />
                      <span>{photo.comments?.length || 0} Comments</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Memory Photo Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-pink-400" /> Share Campus Celebration Memory
            </h3>

            {uploadSuccess ? (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-xl text-xs text-center font-bold">
                {uploadSuccess}
              </div>
            ) : (
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Event / Festival Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Kalakriti 2026 Band Night"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                    <select
                      value={categoryInput}
                      onChange={(e) => setCategoryInput(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                    >
                      <option value="Cultural Fest">Cultural Fest</option>
                      <option value="Dance">Dance</option>
                      <option value="Music">Music</option>
                      <option value="Arts & Creative">Arts & Creative</option>
                      <option value="Teachers Day">Teachers Day</option>
                      <option value="Freshers">Freshers</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Image URL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Caption / Memory Note</label>
                  <textarea
                    rows={3}
                    placeholder="Write a brief caption about this celebration..."
                    value={captionInput}
                    onChange={(e) => setCaptionInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold shadow-md"
                  >
                    Submit for Approval
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Comments Drawer Modal */}
      {activeCommentPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" /> Comments for {activeCommentPhoto.event_name}
              </h3>
              <button onClick={() => setActiveCommentPhoto(null)} className="text-slate-400 hover:text-white text-xs font-bold">
                ✕ Close
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[150px]">
              {(!activeCommentPhoto.comments || activeCommentPhoto.comments.length === 0) ? (
                <p className="text-xs text-slate-400 text-center py-8">No comments yet. Start the conversation!</p>
              ) : (
                activeCommentPhoto.comments.map((c, i) => (
                  <div key={c.id || i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-300">{c.user_name}</span>
                      <span className="text-[10px] text-slate-500">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-200">{c.comment_text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleCommentSubmit} className="flex gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                required
                className="flex-1 px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md"
              >
                <Send className="w-3.5 h-3.5" /> Send
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
