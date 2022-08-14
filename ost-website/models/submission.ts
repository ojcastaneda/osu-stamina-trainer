export enum ApprovalStatus {
	approved,
	pending,
	processing
}

export interface Submission {
	approval_status: keyof typeof ApprovalStatus;
	beatmapset_id: number;
	id: number;
	last_updated: Date;
	title: string;
}

export interface SubmissionsByPage {
	submissions: Submission[];
	limit: number;
}
