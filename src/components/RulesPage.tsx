import { useState, useMemo } from 'react';
import { useStore } from '@/stores/useStore';
import { Plus, Zap, Play, Pause, Trash2, Settings, ArrowRight } from 'lucide-react';
import { Rule, RULE_TRIGGERS, RULE_ACTIONS, COLUMNS, PRIORITIES, RuleTrigger, RuleAction } from '@/types';

export function RulesPage() {
  const { rules, addRule, updateRule, deleteRule, toggleRule, selectedWorkspaceId } = useStore();
  const [showNewRule, setShowNewRule] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState<RuleTrigger>('status_change');
  const [triggerValue, setTriggerValue] = useState('');
  const [action, setAction] = useState<RuleAction>('move_to_status');
  const [actionValue, setActionValue] = useState('');

  const filteredRules = useMemo(() => {
    if (selectedWorkspaceId) {
      return rules.filter(r => r.workspaceId === selectedWorkspaceId || !r.workspaceId);
    }
    return rules;
  }, [rules, selectedWorkspaceId]);

  const activeRules = filteredRules.filter(r => r.isActive);
  const inactiveRules = filteredRules.filter(r => !r.isActive);

  const resetForm = () => {
    setName('');
    setDescription('');
    setTrigger('status_change');
    setTriggerValue('');
    setAction('move_to_status');
    setActionValue('');
    setEditingRule(null);
  };

  const handleCreateRule = async () => {
    if (!name.trim() || !actionValue) return;

    if (editingRule) {
      await updateRule(editingRule.id, {
        name,
        description,
        trigger,
        triggerValue,
        action,
        actionValue,
      });
    } else {
      await addRule({
        name,
        description,
        workspaceId: selectedWorkspaceId || undefined,
        trigger,
        triggerValue,
        action,
        actionValue,
      });
    }

    resetForm();
    setShowNewRule(false);
  };

  const handleEditRule = (rule: Rule) => {
    setEditingRule(rule);
    setName(rule.name);
    setDescription(rule.description || '');
    setTrigger(rule.trigger);
    setTriggerValue(rule.triggerValue || '');
    setAction(rule.action);
    setActionValue(rule.actionValue);
    setShowNewRule(true);
  };

  const getTriggerLabel = (t: RuleTrigger) => RULE_TRIGGERS.find(rt => rt.id === t)?.label || t;
  const getActionLabel = (a: RuleAction) => RULE_ACTIONS.find(ra => ra.id === a)?.label || a;

  const getTriggerValueLabel = (rule: Rule) => {
    if (!rule.triggerValue) return 'Any';
    if (rule.trigger === 'status_change') {
      return COLUMNS.find(c => c.id === rule.triggerValue)?.title || rule.triggerValue;
    }
    if (rule.trigger === 'priority_change') {
      return PRIORITIES.find(p => p.id.toString() === rule.triggerValue)?.label || rule.triggerValue;
    }
    return rule.triggerValue;
  };

  const getActionValueLabel = (rule: Rule) => {
    if (rule.action === 'move_to_status') {
      return COLUMNS.find(c => c.id === rule.actionValue)?.title || rule.actionValue;
    }
    if (rule.action === 'set_priority') {
      return PRIORITIES.find(p => p.id.toString() === rule.actionValue)?.label || rule.actionValue;
    }
    return rule.actionValue;
  };

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Rules</h1>
            <p className="text-slate-500 dark:text-slate-400">Automate your workflow with custom rules</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowNewRule(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            <Plus size={20} />
            New Rule
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Zap size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{filteredRules.length}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Rules</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Play size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{activeRules.length}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <Pause size={20} className="text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{inactiveRules.length}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Inactive</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Rules */}
        {activeRules.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Active Rules</h2>
            <div className="space-y-3">
              {activeRules.map(rule => (
                <div
                  key={rule.id}
                  className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <Zap size={18} className="text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white">{rule.name}</h3>
                        {rule.description && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{rule.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                            {getTriggerLabel(rule.trigger)}: {getTriggerValueLabel(rule)}
                          </span>
                          <ArrowRight size={16} className="text-slate-400" />
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400">
                            {getActionLabel(rule.action)}: {getActionValueLabel(rule)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditRule(rule)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Settings size={16} className="text-slate-400" />
                      </button>
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Pause"
                      >
                        <Pause size={16} className="text-slate-400" />
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inactive Rules */}
        {inactiveRules.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Inactive Rules</h2>
            <div className="space-y-3">
              {inactiveRules.map(rule => (
                <div
                  key={rule.id}
                  className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                        <Zap size={18} className="text-slate-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white">{rule.name}</h3>
                        {rule.description && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{rule.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-500 dark:text-slate-400">
                            {getTriggerLabel(rule.trigger)}: {getTriggerValueLabel(rule)}
                          </span>
                          <ArrowRight size={16} className="text-slate-300 dark:text-slate-600" />
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-500 dark:text-slate-400">
                            {getActionLabel(rule.action)}: {getActionValueLabel(rule)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditRule(rule)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Settings size={16} className="text-slate-400" />
                      </button>
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className="p-2 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                        title="Activate"
                      >
                        <Play size={16} className="text-green-500 dark:text-green-400" />
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredRules.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <Zap size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">No rules yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Create your first automation rule to streamline your workflow</p>
            <button
              onClick={() => setShowNewRule(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Create Rule
            </button>
          </div>
        )}
      </div>

      {/* New/Edit Rule Modal */}
      {showNewRule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                {editingRule ? 'Edit Rule' : 'Create New Rule'}
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Rule Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
                  placeholder="Auto-move completed tasks"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
                  placeholder="What does this rule do?"
                />
              </div>

              {/* Trigger */}
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">When this happens...</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Trigger</label>
                    <select
                      value={trigger}
                      onChange={(e) => setTrigger(e.target.value as RuleTrigger)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                    >
                      {RULE_TRIGGERS.map(t => (
                        <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                      ))}
                    </select>
                  </div>
                  {(trigger === 'status_change' || trigger === 'priority_change') && (
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Condition (optional)</label>
                      {trigger === 'status_change' ? (
                        <select
                          value={triggerValue}
                          onChange={(e) => setTriggerValue(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                        >
                          <option value="">Any status</option>
                          {COLUMNS.map(c => (
                            <option key={c.id} value={c.id}>{c.icon} {c.title}</option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={triggerValue}
                          onChange={(e) => setTriggerValue(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                        >
                          <option value="">Any priority</option>
                          {PRIORITIES.map(p => (
                            <option key={p.id} value={p.id.toString()}>{p.label}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-3">Do this...</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-blue-600 dark:text-blue-400 mb-1">Action</label>
                    <select
                      value={action}
                      onChange={(e) => setAction(e.target.value as RuleAction)}
                      className="w-full px-3 py-2 border border-blue-200 dark:border-blue-800 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                    >
                      {RULE_ACTIONS.map(a => (
                        <option key={a.id} value={a.id}>{a.icon} {a.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-blue-600 dark:text-blue-400 mb-1">Value</label>
                    {action === 'move_to_status' ? (
                      <select
                        value={actionValue}
                        onChange={(e) => setActionValue(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-200 dark:border-blue-800 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                      >
                        <option value="">Select status</option>
                        {COLUMNS.map(c => (
                          <option key={c.id} value={c.id}>{c.icon} {c.title}</option>
                        ))}
                      </select>
                    ) : action === 'set_priority' ? (
                      <select
                        value={actionValue}
                        onChange={(e) => setActionValue(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-200 dark:border-blue-800 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                      >
                        <option value="">Select priority</option>
                        {PRIORITIES.map(p => (
                          <option key={p.id} value={p.id.toString()}>{p.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={actionValue}
                        onChange={(e) => setActionValue(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-200 dark:border-blue-800 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
                        placeholder={action === 'add_tag' ? 'Tag name' : 'Notification message'}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  resetForm();
                  setShowNewRule(false);
                }}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRule}
                disabled={!name.trim() || !actionValue}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {editingRule ? 'Save Changes' : 'Create Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
