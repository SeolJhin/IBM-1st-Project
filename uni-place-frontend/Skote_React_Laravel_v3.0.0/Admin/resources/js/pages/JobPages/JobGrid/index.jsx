import React, { useEffect, useState } from 'react';
import { Container } from 'reactstrap';

//Import Breadcrumb
import Breadcrumbs from "../../../components/Common/Breadcrumb";
import JobData from './JobData';
import { jobsGridData } from '../../../common/data';
import JobFilter from './JobFilter';

const JobGrid = () => {
    document.title = "Jobs Grid | Skote React + Laravel Admin And Dashboard Template";

    const [jobGrid, setJobGrid] = useState();

    useEffect(() => {
        setJobGrid(jobsGridData);
    }, [jobsGridData]);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    {/* Render Breadcrumbs */}
                    <Breadcrumbs title="Jobs" breadcrumbItem="Jobs Grid" />
                    <JobFilter setJobGrid={setJobGrid} jobData={jobsGridData} />
                    <JobData jobGrid={jobGrid} />
                </Container>
            </div>
        </React.Fragment>
    );
};

export default JobGrid;