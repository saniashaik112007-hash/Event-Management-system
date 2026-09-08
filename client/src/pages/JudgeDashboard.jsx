import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, Trophy, Sliders, Star, Save, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';

export default function JudgeDashboard({ currentUser }) {
  const [assignedComps, setAssignedComps] = useState([]);
  const [selectedComp, setSelectedComp] = useState(null);
  const [loading, setLoading] = useState(true);

  // Score matrix state: { [participantId_criteriaId]: scoreValue }
  const [scoresMap, setScoresMap] = useState({});
  const [commentsMap, setCommentsMap] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    loadJudgeComps();
  }, [currentUser]);

  const loadJudgeComps = async () => {
    try {
      setLoading(true);
      const data = await api.getAssignedJudging(currentUser ? currentUser.id : 8);
      setAssignedComps(data);
      if (data.length > 0) {
        setSelectedComp(data[0]);
        // Pre-fill submitted scores into map
        const initialMap = {};
        for (const comp of data) {
          for (const score of comp.submitted_scores || []) {
            initialMap[`${score.participant_id}_${score.criteria_id}`] = score.score_value;
          }
        }
        setScoresMap(initialMap);
      }
    } catch (err) {
      console.error('Fetch assigned judging error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (participantId, criteriaId, value) => {
    const scoreNum = parseFloat(value) || 0;
    setScoresMap(prev => ({
      ...prev,
      [`${participantId}_${criteriaId}`]: scoreNum
    }));
  };

  const calculateTotalForParticipant = (participantId) => {
    if (!selectedComp || !selectedComp.criteria) return 0;
    let total = 0;
    for (const cr of selectedComp.criteria) {
      const val = scoresMap[`${participantId}_${cr.id}`] || 0;
      total += val * (cr.weightage || 1);
    }
    return total.toFixed(1);
  };

  const handleSubmitScores = async (e) => {
    e.preventDefault();
    if (!selectedComp) return;

    try {
      const scoresList = [];
      for (const p of selectedComp.participants || []) {
        for (const cr of selectedComp.criteria || []) {
          const val = scoresMap[`${p.id}_${cr.id}`] || 0;
          scoresList.push({
            participant_id: p.id,
            criteria_id: cr.id,
            score_value: val,
            comments: commentsMap[p.id] || 'Evaluated'
          });
        }
      }

      await api.submitScores({
        competition_id: selectedComp.id,
        scores_list: scoresList,
        judge_user_id: currentUser ? currentUser.id : 8
      });

      setSubmitSuccess('Scores submitted & locked! Results calculated automatically.');
      setTimeout(() => {
        setSubmitSuccess('');
        loadJudgeComps();
      }, 2000);
    } catch (err) {
      alert(err.message || 'Failed to submit scores');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-bold mb-2">
            <Award className="w-3.5 h-3.5" /> Judge Scoring Portal
          </div>
          <h1 className="text-3xl font-extrabold text-white">Participant Evaluation & Scoring Matrix</h1>
          <p className="text-xs text-slate-300 mt-1">Select assigned competitions, score participants on criteria, and lock scorecards.</p>
        </div>
      </div>

      {/* Select Competition Pills */}
      {assignedComps.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {assignedComps.map(comp => (
            <button
              key={comp.id}
              onClick={() => setSelectedComp(comp)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border whitespace-nowrap ${
                selectedComp && selectedComp.id === comp.id
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-600/30'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              {comp.name} ({comp.event_title})
            </button>
          ))}
        </div>
      )}

      {/* Score Matrix Form */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 animate-pulse">Loading assigned competitions...</div>
      ) : !selectedComp ? (
        <div className="glass-card p-10 rounded-2xl text-center text-slate-400 text-xs">
          No competition assigned to your judge profile yet.
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-2xl font-extrabold text-white">{selectedComp.name}</h2>
              <p className="text-xs text-slate-300 mt-1">Rules: {selectedComp.rules}</p>
            </div>
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full text-xs font-bold">
              {selectedComp.participants?.length || 0} Registered Participants
            </span>
          </div>

          {submitSuccess && (
            <div className="p-4 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-2xl text-xs font-bold text-center">
              {submitSuccess}
            </div>
          )}

          {(!selectedComp.participants || selectedComp.participants.length === 0) ? (
            <p className="text-xs text-slate-400 text-center py-8">No participants registered for this competition yet.</p>
          ) : (
            <form onSubmit={handleSubmitScores} className="space-y-6 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-200 min-w-[700px]">
                <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3 font-bold">Participant / Team</th>
                    {selectedComp.criteria?.map(cr => (
                      <th key={cr.id} className="p-3 font-bold">
                        {cr.criteria_name} <span className="text-[9px] text-cyan-400 font-mono">(Max {cr.max_score})</span>
                      </th>
                    ))}
                    <th className="p-3 font-bold text-amber-400 text-right">Total Score</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/60">
                  {selectedComp.participants.map(p => (
                    <tr key={p.id} className="hover:bg-slate-900/50">
                      <td className="p-3">
                        <div className="font-bold text-white text-sm">{p.participant_name}</div>
                        <div className="text-[10px] text-slate-400">{p.team_name}</div>
                      </td>

                      {selectedComp.criteria?.map(cr => (
                        <td key={cr.id} className="p-3">
                          <input
                            type="number"
                            min="0"
                            max={cr.max_score}
                            step="0.5"
                            value={scoresMap[`${p.id}_${cr.id}`] !== undefined ? scoresMap[`${p.id}_${cr.id}`] : ''}
                            onChange={(e) => handleScoreChange(p.id, cr.id, e.target.value)}
                            required
                            className="w-20 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
                          />
                        </td>
                      ))}

                      <td className="p-3 text-right">
                        <span className="font-mono text-base font-extrabold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                          {calculateTotalForParticipant(p.id)} pts
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-cyan-600/30 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Submit Score Matrix & Calculate Ranks</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

    </div>
  );
}
