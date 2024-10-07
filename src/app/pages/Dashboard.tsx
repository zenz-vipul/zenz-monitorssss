"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios'; 

const REPO_OWNER = process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER;
const REPO_NAME = process.env.NEXT_PUBLIC_GITHUB_REPO_NAME;
const GITHUB_TOKEN = process.env.NEXT_PUBLIC_GITHUB_TOKEN;

interface WorkflowRun {
    id: number;
    conclusion: string | null;
    created_at: string;
}

interface Workflow {
    id: number;
    name: string;
    runs: WorkflowRun[];
}

const Dashboard: React.FC = () => {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [userCount, setUserCount] = useState<number | null>(null); 
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [error, setError] = useState<string | null>(null);

    const fetchWorkflows = async () => {
        try {
            const response = await axios.get(
                `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows`,
                {
                    headers: {
                        Authorization: `token ${GITHUB_TOKEN}`,
                    },
                }
            );

            const workflowData = await Promise.all(
                response.data.workflows.map(async (workflow: any) => {
                    const runsResponse = await axios.get(
                        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${workflow.id}/runs`,
                        {
                            headers: {
                                Authorization: `token ${GITHUB_TOKEN}`,
                            },
                        }
                    );
                    return {
                        name: workflow.name,
                        runs: runsResponse.data.workflow_runs,
                    } as Workflow;
                })
            );

            setWorkflows(workflowData);
        } catch (error) {
            setError("Failed to fetch workflows. Please try again later.");
            if (axios.isAxiosError(error)) {
                console.error("Error fetching workflows:", error.response?.data || error.message);
            } else {
                console.error("Unexpected error:", error);
            }
        }
    };

    const fetchUserCount = async () => {
        try {
            const response = await axios.get(
                'https://api.moinet.io/iome/v0/analytics/getusercount',
            );
            console.log("Count", response.data);
            setUserCount(response.data.data.count); 
        } catch (error) {
            console.log("Failed to fetch user count. Please try again later.");
            if (axios.isAxiosError(error)) {
                console.error("Error fetching user count:", error.response?.data || error.message);
            } else {
                console.error("Unexpected error:", error);
            }
        }
    }

    useEffect(() => {
        fetchWorkflows();
        fetchUserCount();
    }, []);

    const allRuns = workflows.flatMap(workflow =>
        workflow.runs.map(run => ({
            workflowName: workflow.name,
            ...run
        }))
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const totalPages = Math.ceil(allRuns.length / itemsPerPage);
    const currentItems = allRuns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Display usercount */}
            <h3 className="text-4xl font-bold  mb-8">
                { `Total Users: ${userCount}`}
            </h3> 
            {error && <div className="text-red-600 text-center mb-4">{error}</div>}

            <h1 className="text-4xl font-bold text-center mb-8">
                CI/CD Dashboard and Health Report
            </h1>
            <div className="overflow-x-auto mt-6">
                <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-lg">
                    <thead>
                        <tr className="bg-blue-500 text-white text-left">
                            <th className="py-3 px-4 border-b border-gray-300">Workflow Name</th>
                            <th className="py-3 px-4 border-b border-gray-300">Status</th>
                            <th className="py-3 px-4 border-b border-gray-300">Tested At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? (
                            currentItems.map(run => (
                                <tr key={run.id} className="hover:bg-gray-50 transition duration-200">
                                    <td className="py-3 px-4 border-b border-gray-300">{run.workflowName}</td>
                                    <td className={`py-3 px-4 border-b border-gray-300 ${run.conclusion === 'success' ? 'text-green-600' : run.conclusion === 'failure' ? 'text-red-600' : 'text-yellow-600'}`}>
                                        {run.conclusion || "In Progress"}
                                    </td>
                                    <td className="py-3 px-4 border-b border-gray-300">{new Date(run.created_at).toLocaleString()}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="py-4 text-center text-gray-500">No workflows found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center items-center mt-6 space-x-1">
                <button
                    className="bg-blue-500 text-white px-2 py-1 text-sm rounded hover:bg-blue-600 disabled:bg-gray-400"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    Previous
                </button>

                {/* Numbered Pagination */}
                {Array.from({ length: totalPages }, (_, index) => (
                    <button
                        key={index + 1}
                        className={`px-2 py-1 text-sm rounded ${currentPage === index + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        onClick={() => setCurrentPage(index + 1)}
                    >
                        {index + 1}
                    </button>
                ))}

                <button
                    className="bg-blue-500 text-white px-2 py-1 text-sm rounded hover:bg-blue-600 disabled:bg-gray-400"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    Next
                </button>
            </div>

        </div>
    );
};

export default Dashboard;
