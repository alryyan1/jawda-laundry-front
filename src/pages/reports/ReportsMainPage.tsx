import React from 'react';
import { useNavigate } from 'react-router-dom';

const ReportsMainPage: React.FC = () => {
    const navigate = useNavigate();

    // Auto-redirect to income report
    React.useEffect(() => {
        navigate('/reports/sales', { replace: true });
    }, [navigate]);

    return null;
};

export default ReportsMainPage;
