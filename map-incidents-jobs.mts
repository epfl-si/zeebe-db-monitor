#!/usr/bin/env -S npx zx

// utils
function msToIso(ms: string) {
  return new Date(Number(ms)).toISOString()
}

console.log(`Loading jobs...`)

//@ts-ignore
const jobsData = await $`tsx src/index.ts export --columnFamilyName JOBS`.json()
console.log(`Loaded ${jobsData.length} jobs`)

console.log(`Loading incidents...`)

//@ts-ignore
const incidentsData = await $`tsx src/index.ts export --columnFamilyName INCIDENTS`.json()
console.log(`Loaded ${incidentsData.length} jobs`)

/**
 * Build JOB lookup
 */
const jobs = new Map()

for (const entry of jobsData) {
  if (
    !entry.key?.key ||
    !entry.value?.jobRecord
  ) { continue; }

  const jobKey = entry.key.key
  const jobRecord = entry.value.jobRecord

  jobs.set(jobKey, {
    type: jobRecord.type,
    worker: jobRecord.worker,
    retries: jobRecord.retries,
    processInstanceKey: jobRecord.processInstanceKey,
    processDefinitionVersion: jobRecord.processDefinitionVersion,
    elementId: jobRecord.elementId,
    deadline: msToIso(jobRecord.deadline)
  })
}



/**
 * Extend INCIDENTS
 */
const extendedIncidents = []

for (const entry of incidentsData) {
  if (
    !entry.value?.incidentRecord ||
    !entry.value?.incidentRecord.jobKey
  ) { continue; }

  const incident = entry.value?.incidentRecord
  const jobKey = Number(incident.jobKey)

  const job = jobs.get(jobKey)
  if (!job) continue

  extendedIncidents.push({
    ...incident,
    job_type: job.type,
    job_retries: job.retries,
    job_processInstanceKey: job.processInstanceKey,
    job_processDefinitionVersion: job.processDefinitionVersion,
    job_elementId: job.elementId,
    job_deadline: job.deadline,
  })
}

// Write output
//@ts-ignore
fs.writeFileSync(
  'extended-incidents.json',
  JSON.stringify(extendedIncidents, null, 2)
)

console.log(`Written ${extendedIncidents.length} extended incidents with JobKey`)
