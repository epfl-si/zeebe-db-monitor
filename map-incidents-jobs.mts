#!/usr/bin/env -S npm exec --yes --package=zx@latest zx --
// @ts-ignore
import { $ } from 'zx'
import fs from 'fs'


// utils
function msToIso(ms: string) {
  return new Date(Number(ms)).toISOString()
}

console.log(`Loading jobs...`)
const jobsData = await $`tsx src/index.ts export  --columnFamilyName JOBS`.json()

console.log(`Loading incidents...`)
const incidentsData = await $`tsx src/index.ts export  --columnFamilyName INCIDENTS`.json()

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
    elementId: jobRecord.elementId,
    deadline: msToIso(jobRecord.deadline)
  })
}

console.log(`Loaded ${jobs.size} jobs`)

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
    job_elementId: job.elementId,
    job_deadline: job.deadline,
  })
}

// Write output
fs.writeFileSync(
  'extended-incidents.json',
  JSON.stringify(extendedIncidents, null, 2)
)

console.log(`Written ${extendedIncidents.length} extended incidents with JobKey`)
