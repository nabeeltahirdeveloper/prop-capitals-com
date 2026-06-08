import { useTranslation } from "../../contexts/LanguageContext"

const DEBUG_ATTEMPTS = true

const formatDateTime = (value, t) => {
  if (!value) return t("adminConsole.ipHistoryModal.notAvailable", { defaultValue: "N/A" })
  try {
    return new Date(value).toLocaleString()
  } catch {
    return t("adminConsole.ipHistoryModal.invalidDate", { defaultValue: "Invalid date" })
  }
}

const formatTimeDiff = (current, previous) => {
  if (!current || !previous) return '—'
  const currentDate = new Date(current)
  const previousDate = new Date(previous)
  const diffMs = currentDate.getTime() - previousDate.getTime()

  if (DEBUG_ATTEMPTS) {
    console.log('[formatTimeDiff] inputs', {
      current,
      previous,
      currentMs: currentDate.getTime(),
      previousMs: previousDate.getTime(),
      diffMs
    })
  }

  if (!Number.isFinite(diffMs) || diffMs < 0) return '—'

  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return `${seconds}s`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    const sec = seconds % 60
    return sec > 0 ? `${minutes}m ${sec}s` : `${minutes}m`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const days = Math.floor(hours / 24)
  const hrs = hours % 24
  return hrs > 0 ? `${days}d ${hrs}h` : `${days}d`
}

const sortAttemptsNewestFirst = (attempts = []) => {
  return [...attempts].sort((a, b) => {
    const timeA = new Date(a.attempt_time).getTime()
    const timeB = new Date(b.attempt_time).getTime()
    if (!Number.isFinite(timeA) || !Number.isFinite(timeB)) return 0
    return timeB - timeA
  })
}

export default function IPAttemptHistoryModal({
  total = 0,
  attempts = [],
  loading = false,
  error = '',
  onRefresh
}) {
  const { t } = useTranslation()
  if (DEBUG_ATTEMPTS) {
    console.groupCollapsed('[IPAttemptHistoryModal] Raw attempts payload')
    console.table(attempts || [])
    console.groupEnd()
  }

  const orderedAttempts = sortAttemptsNewestFirst(attempts)

  if (DEBUG_ATTEMPTS) {
    console.groupCollapsed('[IPAttemptHistoryModal] Ordered attempts (newest first)')
    console.table(orderedAttempts || [])
    console.groupEnd()
  }

  const attemptsWithDiff = orderedAttempts.map((attempt, index) => {
    const previousInList = orderedAttempts[index + 1]

    if (DEBUG_ATTEMPTS) {
      console.log('[AttemptDiff]', {
        attempt_number: attempt?.attempt_number,
        current: attempt?.attempt_time,
        previous: previousInList?.attempt_time
      })
    }

    return {
      ...attempt,
      timeSinceLast: previousInList
        ? formatTimeDiff(attempt.attempt_time, previousInList.attempt_time)
        : '—'
    }
  })

  if (DEBUG_ATTEMPTS) {
    const sampleDebug = [
      { attempt_number: 'sample-1', attempt_time: '2025-01-01T00:00:00.000Z' },
      { attempt_number: 'sample-2', attempt_time: '2025-01-01T12:34:56.000Z' },
      { attempt_number: 'sample-3', attempt_time: '2025-01-03T15:00:00.000Z' }
    ]
    const sampleOrdered = sortAttemptsNewestFirst(sampleDebug)
    const sampleDiffs = sampleOrdered.map((attempt, idx) => {
      const prev = sampleOrdered[idx + 1]
      return {
        attempt_number: attempt.attempt_number,
        current: attempt.attempt_time,
        previous: prev?.attempt_time,
        diff: prev ? formatTimeDiff(attempt.attempt_time, prev.attempt_time) : '—'
      }
    })
    console.groupCollapsed('[IPAttemptHistoryModal] Sample diff sanity check')
    console.table(sampleDiffs)
    console.groupEnd()
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-inner">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-700 gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">{t("adminConsole.ipHistoryModal.attemptHistory", { defaultValue: "Attempt History" })}</p>
          <p className="text-white text-base sm:text-lg font-semibold">
            {total} {total === 1 ? t("adminConsole.ipHistoryModal.attemptSingular", { defaultValue: "attempt" }) : t("adminConsole.ipHistoryModal.attemptPlural", { defaultValue: "attempts" })}
          </p>
          <p className="text-xs text-gray-500 hidden sm:block">
            {t("adminConsole.ipHistoryModal.newestFirstNote", { defaultValue: "Newest attempts appear first for accurate auditing." })}
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-2 text-xs sm:text-sm px-3 py-2 rounded-lg bg-gray-800 text-cyan-400 hover:bg-gray-700 active:bg-gray-600 transition-colors min-h-[44px] min-w-[100px] justify-center"
          aria-label={t("adminConsole.ipHistoryModal.refreshAttemptHistory", { defaultValue: "Refresh attempt history" })}
        >
          <i className="fas fa-sync-alt text-xs sm:text-sm"></i>
          {t("adminConsole.ipHistoryModal.refresh", { defaultValue: "Refresh" })}
        </button>
      </div>

      {error && (
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-700 bg-red-900/40 text-xs sm:text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="max-h-64 sm:max-h-72 overflow-y-auto divide-y divide-gray-800">
        {loading ? (
          <div className="py-8 sm:py-12 flex flex-col items-center text-gray-400 gap-2 sm:gap-3">
            <i className="fas fa-spinner fa-spin text-xl sm:text-2xl text-cyan-400"></i>
            <p className="text-xs sm:text-sm">{t("adminConsole.ipHistoryModal.loading", { defaultValue: "Loading attempt history..." })}</p>
          </div>
        ) : attemptsWithDiff.length === 0 ? (
          <div className="py-8 sm:py-12 text-center text-gray-400">
            <i className="fas fa-history text-xl sm:text-2xl mb-2 sm:mb-3"></i>
            <p className="text-xs sm:text-sm">{t("adminConsole.ipHistoryModal.noHistory", { defaultValue: "No attempt history recorded yet." })}</p>
          </div>
        ) : (
          attemptsWithDiff.map((attempt) => (
            <div
              key={`${attempt.attempt_number}-${attempt.attempt_time}`}
              className="px-3 sm:px-4 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wide text-gray-500">{t("adminConsole.ipHistoryModal.attemptNumber", { defaultValue: "Attempt #" })}</p>
                <p className="text-white font-semibold text-base sm:text-lg">#{attempt.attempt_number}</p>
              </div>
              <div className="flex-1 text-left sm:text-right min-w-0">
                <p className="text-xs uppercase tracking-wide text-gray-500">{t("adminConsole.ipHistoryModal.attemptTime", { defaultValue: "Attempt Time" })}</p>
                <p className="text-gray-200 text-xs sm:text-sm break-words">{formatDateTime(attempt.attempt_time, t)}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {attempt.timeSinceLast === '—'
                    ? '—'
                    : t("adminConsole.ipHistoryModal.sinceLastAttempt", { duration: attempt.timeSinceLast, defaultValue: "{{duration}} since last attempt" })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

