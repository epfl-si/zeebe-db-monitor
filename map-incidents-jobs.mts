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
console.log(`Loaded ${incidentsData.length} incidents`)

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

let countIncidentWithoutRecord = 0
let countIncidentWithoutJobKey = 0
let countIncidentsWithoutJobs = 0
let countSafeFailIgnored = 0

/**
 * Extend INCIDENTS with jobs data
 */
const extendedIncidents = []

for (const entry of incidentsData) {
  if (!entry.value?.incidentRecord) {
    countIncidentWithoutRecord++;
    continue
  }
  if (!entry.value?.incidentRecord.jobKey) {
    countIncidentWithoutJobKey++;
    continue;
  }

  const incident = entry.value?.incidentRecord
  // keep the key too
  incident.incidentKey = entry.key.key

  const jobKey = Number(incident.jobKey)

  const job = jobs.get(jobKey)
  if (!job) {
    countIncidentsWithoutJobs++;
    continue
  }

  if (incident.errorMessage?.search("This is a safe fail.") != -1) {
    countSafeFailIgnored++;
    continue;
  }

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

console.log(`=========`)
console.log(`Written ${extendedIncidents.length} extended incidents with JobKey in extended-incidents.json`)
console.log(`---------`)
console.log(`Skipped:`)
console.log(`  Incidents without values: ${countIncidentWithoutRecord}`)
console.log(`  Incidents without job key: ${countIncidentWithoutJobKey}`)
console.log(`  Incidents with not-found job: ${countIncidentsWithoutJobs}`)
console.log(`  Incident "safe fail" ignored: ${countSafeFailIgnored}`)
