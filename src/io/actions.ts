import * as core from "@actions/core";
import * as github from "@actions/github";

export async function getJobTiming(context, { jobId }: { jobId: string }): Promise<{ value: string }> {
  const { token, owner, repo, branch } = context;

  try {
    const octokit = github.getOctokit(token);
    const jobData = jobId.split('-');
    const jobList = await octokit.actions.listJobsForWorkflowRun({
      owner,
      repo,
      run_id: Number(jobData[0]),
    });
    const res = await octokit.actions.getJobForWorkflowRun({
      owner,
      repo,
      job_id: Number(jobList.data.jobs.filter(job => job.name === jobData[1])[0].id),
    });
    if (res?.status == 200) {
      console.log(res.data.started_at, res.data.completed_at);
      const completeTime = new Date(res.data.completed_at).getTime()
      const startTime = new Date(res.data.started_at).getTime()

      return {
        value: String((completeTime - startTime) / 1000),
      };
    } else {
      core.warning(`Unexpected response code ${res?.status} for getJobTiming()`);
    }
  } catch (err) {
    core.error(
      `Reading from workflow_id:${jobId} on ${branch} failed: ${err.message}`
    );
  }
  return { value: null };
}