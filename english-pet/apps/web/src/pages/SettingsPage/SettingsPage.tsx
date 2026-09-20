import { useState } from 'react'
import type { LanguageLevel, SpeechRate } from '@english-pet/contracts'
import { Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/auth/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { currentLocale, getCopy } from '@/i18n/copy'

export default function SettingsPage() {
  const { session, updateSettings, deleteAccount } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  if (!session) return null
  const locale = currentLocale(session.settings.interfaceLocale)
  const t = getCopy(locale)

  async function save(patch: Parameters<typeof updateSettings>[0]) {
    setSaving(true)
    try {
      await updateSettings(patch)
      toast.success(t.saved)
    } catch {
      toast.error(t.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  async function removeAccount() {
    const confirmed = window.confirm(locale === 'en'
      ? 'Delete this account and all in-memory conversations, memories, journals, event progress, and settings? This cannot be undone.'
      : '删除此账号及当前内存中的全部对话、记忆、日记、事件进度和设置？此操作无法撤销。')
    if (!confirmed) return
    setSaving(true)
    try {
      await deleteAccount()
      navigate('/')
    } catch {
      toast.error(locale === 'en' ? 'Account data could not be deleted.' : '账号数据未能删除。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">{t.settingsEyebrow}</p>
      <h1 className="mt-2 font-serif text-4xl">{t.settingsTitle}</h1>
      <p className="mt-3 text-muted-foreground">{t.settingsBody}</p>

      <div className="mt-9 space-y-5">
        <Card>
          <CardHeader><CardTitle>{t.interfaceLanguage}</CardTitle><CardDescription>{t.settingsBody}</CardDescription></CardHeader>
          <CardContent>
            <Select value="zh-CN" disabled>
              <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="zh-CN">{t.chinese}</SelectItem></SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t.englishVoice}</CardTitle><CardDescription>{locale === 'en' ? 'Adjust support and listening pace without taking a level test.' : '无需水平测试，即可调整辅助程度和听力语速。'}</CardDescription></CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2"><Label>{t.englishSupport}</Label><Select value={session.settings.languageLevel} disabled={saving} onValueChange={(value) => void save({ languageLevel: value as LanguageLevel })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="L1">{t.moreSupport}</SelectItem><SelectItem value="L2">{t.everyday}</SelectItem><SelectItem value="L3">{t.independent}</SelectItem><SelectItem value="L4">{t.nuance}</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>{t.speechRate}</Label><Select value={session.settings.speechRate} disabled={saving} onValueChange={(value) => void save({ speechRate: value as SpeechRate })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1.0">1.0×</SelectItem><SelectItem value="0.8">0.8×</SelectItem><SelectItem value="0.6">0.6×</SelectItem></SelectContent></Select></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t.memoryAccess}</CardTitle><CardDescription>{t.memoryAccessBody}</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <SettingSwitch label={t.subtitles} description={t.subtitlesBody} checked={session.settings.subtitlesEnabled} disabled={saving} onCheckedChange={(checked) => void save({ subtitlesEnabled: checked })} />
            <SettingSwitch label={t.voiceInput} description={t.voiceInputBody} checked={session.settings.voiceInputEnabled} disabled={saving} onCheckedChange={(checked) => void save({ voiceInputEnabled: checked })} />
            <SettingSwitch label={t.voiceOutput} description={t.voiceOutputBody} checked={session.settings.voiceOutputEnabled} disabled={saving} onCheckedChange={(checked) => void save({ voiceOutputEnabled: checked })} />
            <SettingSwitch label={t.useMemories} description={t.useMemoriesBody} checked={session.settings.memoryEnabled} disabled={saving} onCheckedChange={(checked) => void save({ memoryEnabled: checked })} />
          </CardContent>
        </Card>

        <Card className="border-destructive/40">
          <CardHeader><CardTitle>{locale === 'en' ? 'Delete account data' : '删除账号数据'}</CardTitle><CardDescription>{locale === 'en' ? 'Permanently clears the current account, settings, conversations, event progress, memories, and journal entries in this development service.' : '永久清除当前开发服务中的账号、设置、对话、事件进度、长期记忆和共同记忆。'}</CardDescription></CardHeader>
          <CardContent><Button variant="destructive" disabled={saving} onClick={() => void removeAccount()}><Trash2 />{locale === 'en' ? 'Delete account and data' : '删除账号及全部数据'}</Button></CardContent>
        </Card>

        <div className="border border-warning/30 bg-warning/5 p-4 text-sm text-muted-foreground">{t.devStorage}</div>
      </div>
    </main>
  )
}

interface SettingSwitchProps {
  label: string
  description: string
  checked: boolean
  disabled: boolean
  onCheckedChange: (checked: boolean) => void
}

function SettingSwitch({ label, description, checked, disabled, onCheckedChange }: SettingSwitchProps) {
  return <div className="flex items-start justify-between gap-4 border-b border-border pb-5 last:border-0 last:pb-0"><div><Label>{label}</Label><p className="mt-1 text-sm text-muted-foreground">{description}</p></div><Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} /></div>
}
