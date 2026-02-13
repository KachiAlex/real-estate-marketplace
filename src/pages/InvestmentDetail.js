import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Badge, 
  Alert, 
  Modal,
  Form,
  ProgressBar,
  Image
} from 'react-bootstrap';
import { useInvestment } from '../contexts/InvestmentContext';
import { useEscrow } from '../contexts/EscrowContext';
import { useAuth } from '../contexts/AuthContext';

const InvestmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getInvestmentById } = useInvestment();
  const { createEscrowTransaction, getEscrowTransaction } = useEscrow();
  
  const [investment, setInvestment] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [escrowTransaction, setEscrowTransaction] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadInvestmentDetails();
  }, [id]);

  const loadInvestmentDetails = async () => {
    try {
      setLoading(true);
      const investmentData = await getInvestmentById(id);
      
      if (!investmentData) {
        setError('Investment not found');
        setLoading(false);
        return;
      }
      
      setInvestment(investmentData);

      // Load vendor details from investment sponsor data (already populated)
      const vendorIdToLoad = investmentData?.vendorId || investmentData?.sponsorId;
      if (investmentData.sponsor) {
        // Use sponsor info from investment data
        setVendor(investmentData.sponsor);
      }

      // Check if user already has an escrow transaction for this investment
      if (user && user.role === 'buyer') {
        try {
          const escrowData = await getEscrowTransaction(id);
          setEscrowTransaction(escrowData);
        } catch (err) {
          // No existing escrow transaction
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInvest = async () => {
    if (!user || (!user.id && !user.uid)) {
      setError('Please login to invest');
      return;
    }

    if (!investmentAmount || parseFloat(investmentAmount) <= 0) {
      setError('Please enter a valid investment amount');
      return;
    }

    if (!investment) {
      setError('Investment data not loaded');
      return;
    }

    // Normalize investment data
    const normalizedInvestment = {
      ...investment,
      currentFunding: Number(investment.currentFunding ?? investment.raisedAmount ?? 0) || 0,
      targetAmount: Number(investment.targetAmount ?? investment.totalAmount ?? 0) || 0,
      minInvestment: Number(investment.minInvestment ?? investment.minimumInvestment ?? 0) || 0,
      maxInvestment: Number(investment.maxInvestment ?? investment.totalAmount ?? 0) || 0,
      expectedROI: Number(investment.expectedROI ?? investment.expectedReturn ?? 0) || 0,
      termMonths: Number(investment.termMonths ?? investment.duration ?? 0) || 0,
      propertyLocation: investment.propertyLocation ?? (investment.location?.address ? `${investment.location.address}, ${investment.location.city}` : 'N/A')
    };

    const minInvestment = normalizedInvestment.minInvestment;
    if (parseFloat(investmentAmount) < minInvestment) {
      setError(`Minimum investment amount is $${(Number(minInvestment) || 0).toLocaleString()}`);
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // Create escrow transaction for investment
      const vendorId = investment.vendorId ?? investment.sponsorId ?? null;
      const result = await createEscrowTransaction(
        id,
        parseFloat(investmentAmount),
        user.uid || user.id,
        vendorId,
        {
          type: 'investment',
          investmentData: {
            ...investment,
            title: investment.title,
            investmentTitle: investment.title,
            expectedROI: normalizedInvestment.expectedROI,
            expectedReturn: normalizedInvestment.expectedROI,
            lockPeriod: normalizedInvestment.termMonths,
            termMonths: normalizedInvestment.termMonths,
            duration: normalizedInvestment.termMonths,
            vendorId: vendorId,
            sponsorId: vendorId,
            sponsor: investment.sponsor || vendor,
            vendor: investment.vendor || investment.sponsor,
            propertyLocation: normalizedInvestment.propertyLocation
          }
        }
      );

      if (!result.success) {
        setError(result.error || 'Failed to create escrow transaction');
        return;
      }

      const escrowId = result.id || result.data?.id;
      if (!escrowId) {
        setError('Failed to get escrow transaction ID');
        return;
      }

      setShowInvestModal(false);
      navigate(`/escrow/${escrowId}`);
    } catch (err) {
      console.error('Investment error:', err);
      setError(err.message || 'An error occurred while processing your investment');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { variant: 'success', text: 'Active' },
      funded: { variant: 'info', text: 'Fully Funded' },
      completed: { variant: 'secondary', text: 'Completed' },
      cancelled: { variant: 'danger', text: 'Cancelled' }
    };

    const config = statusConfig[status] || { variant: 'secondary', text: status };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const getRiskLevel = (riskScore) => {
    if (riskScore <= 3) return { level: 'Low', color: 'success' };
    if (riskScore <= 6) return { level: 'Medium', color: 'warning' };
    return { level: 'High', color: 'danger' };
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  if (error || !investment) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          {error || 'Investment not found'}
        </Alert>
        <Button variant="outline-primary" onClick={() => navigate('/investments')}>
          Back to Investments
        </Button>
      </Container>
    );
  }

  // Normalize investment data to handle different property names and missing values
  const normalizedInvestment = {
    ...investment,
    // Map actual properties to expected ones - ensure all numeric values are numbers
    currentFunding: Number(investment.currentFunding ?? investment.raisedAmount ?? 0) || 0,
    targetAmount: Number(investment.targetAmount ?? investment.totalAmount ?? 0) || 0,
    minInvestment: Number(investment.minInvestment ?? investment.minimumInvestment ?? 0) || 0,
    maxInvestment: Number(investment.maxInvestment ?? investment.totalAmount ?? 0) || 0,
    expectedROI: Number(investment.expectedROI ?? investment.expectedReturn ?? 0) || 0,
    termMonths: Number(investment.termMonths ?? investment.duration ?? 0) || 0,
    riskScore: Number(investment.riskScore ?? (investment.expectedReturn && investment.expectedReturn > 20 ? 7 : investment.expectedReturn && investment.expectedReturn > 15 ? 5 : 3)) || 5,
    propertyType: investment.propertyType ?? investment.type ?? 'N/A',
    propertyLocation: investment.propertyLocation ?? (investment.location?.address ? `${investment.location.address}, ${investment.location.city}` : 'N/A'),
    propertyValue: Number(investment.propertyValue ?? investment.totalAmount ?? 0) || 0,
    propertyDescription: investment.propertyDescription ?? investment.description ?? '',
    paymentSchedule: investment.paymentSchedule ?? 'Monthly',
    exitStrategy: investment.exitStrategy ?? 'End of term',
    vendorId: investment.vendorId ?? investment.sponsorId ?? null
  };

  const riskInfo = getRiskLevel(normalizedInvestment.riskScore ?? 5);
  const progressPercentage = normalizedInvestment.targetAmount > 0 
    ? (normalizedInvestment.currentFunding / normalizedInvestment.targetAmount) * 100 
    : 0;

  return (
    <Container fluid className="px-0">
      {/* Hero Section with Image and Header */}
      <div className="position-relative mb-4" style={{ backgroundColor: '#f8f9fa' }}>
        <Row className="g-0">
          {investment.images && investment.images.length > 0 && (
            <Col lg={8}>
              <div style={{ height: '500px', overflow: 'hidden' }}>
                <Image 
                  src={investment.images[0]} 
                  alt={investment.title}
                  fluid
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </Col>
          )}
          <Col lg={investment.images && investment.images.length > 0 ? 4 : 12}>
            <div className="p-4 h-100 d-flex flex-column justify-content-between" style={{ minHeight: investment.images && investment.images.length > 0 ? '500px' : 'auto', backgroundColor: '#fff' }}>
              <div>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="flex-grow-1">
                    <h1 className="h2 mb-2 fw-bold">{investment.title}</h1>
                    <p className="text-muted mb-3">{investment.subtitle || 'Investment Opportunity'}</p>
                  </div>
                  <div className="ms-3">
                    {getStatusBadge(investment.status)}
                  </div>
                </div>

                {/* Key Metrics - Compact */}
                <Row className="g-3 mb-4">
                  <Col xs={6} sm={4}>
                    <div className="text-center p-3 bg-light rounded">
                      <div className="text-muted small mb-1">ROI</div>
                      <div className="h4 text-success mb-0 fw-bold">{normalizedInvestment.expectedROI || 0}%</div>
                    </div>
                  </Col>
                  <Col xs={6} sm={4}>
                    <div className="text-center p-3 bg-light rounded">
                      <div className="text-muted small mb-1">Term</div>
                      <div className="h4 mb-0 fw-bold">{normalizedInvestment.termMonths || 0}m</div>
                    </div>
                  </Col>
                  <Col xs={12} sm={4}>
                    <div className="text-center p-3 bg-light rounded">
                      <div className="text-muted small mb-1">Risk</div>
                      <Badge bg={riskInfo.color} className="fs-6 px-3 py-2">{riskInfo.level}</Badge>
                    </div>
                  </Col>
                </Row>

                {/* Funding Progress - Compact */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted small">Funding Progress</span>
                    <span className="fw-bold text-primary">{progressPercentage.toFixed(1)}%</span>
                  </div>
                  <ProgressBar 
                    now={progressPercentage} 
                    variant="success"
                    style={{ height: '12px', borderRadius: '6px' }}
                    className="mb-2"
                  />
                  <Row className="g-2 text-center">
                    <Col xs={6}>
                      <div className="p-2 bg-light rounded">
                        <div className="text-muted small">Raised</div>
                        <div className="fw-bold text-success">${(Number(normalizedInvestment.currentFunding) || 0).toLocaleString()}</div>
                      </div>
                    </Col>
                    <Col xs={6}>
                      <div className="p-2 bg-light rounded">
                        <div className="text-muted small">Target</div>
                        <div className="fw-bold">${(Number(normalizedInvestment.targetAmount) || 0).toLocaleString()}</div>
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>

              {/* Action Button in Hero */}
              {investment.status === 'active' && user?.role === 'buyer' && (
                <div className="mt-auto">
                  {escrowTransaction ? (
                    <Alert variant="info" className="mb-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>Investment in Progress</strong>
                          <div className="small">Active escrow transaction</div>
                        </div>
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => navigate(`/escrow/${escrowTransaction.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    </Alert>
                  ) : (
                    <Button 
                      variant="success" 
                      size="lg" 
                      className="w-100 fw-bold"
                      onClick={() => setShowInvestModal(true)}
                    >
                      Invest Now
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Col>
        </Row>
      </div>

      <Container>
        <Row>
          <Col lg={8}>
            {/* Investment Overview */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Body className="p-4">
                <h4 className="mb-3 fw-bold">About This Investment</h4>
                <p className="lead mb-0" style={{ lineHeight: '1.8' }}>{investment.description}</p>
              </Card.Body>
            </Card>

            {/* Property & Investment Details Combined */}
            <Row className="g-4 mb-4">
              <Col md={6}>
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <h5 className="mb-3 fw-bold">Property Collateral</h5>
                    <div className="mb-3">
                      <div className="text-muted small mb-1">Property Type</div>
                      <div className="fw-semibold">{normalizedInvestment.propertyType || 'N/A'}</div>
                    </div>
                    <div className="mb-3">
                      <div className="text-muted small mb-1">Location</div>
                      <div className="fw-semibold">{normalizedInvestment.propertyLocation || 'N/A'}</div>
                    </div>
                    <div className="mb-3">
                      <div className="text-muted small mb-1">Estimated Value</div>
                      <div className="h5 text-primary mb-0 fw-bold">${(Number(normalizedInvestment.propertyValue) || 0).toLocaleString()}</div>
                    </div>
                    {normalizedInvestment.propertyDescription && (
                      <div>
                        <div className="text-muted small mb-1">Details</div>
                        <div className="text-muted small">{normalizedInvestment.propertyDescription}</div>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <h5 className="mb-3 fw-bold">Investment Terms</h5>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <span className="text-muted">Minimum Investment</span>
                        <span className="fw-bold">${(Number(normalizedInvestment.minInvestment) || 0).toLocaleString()}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <span className="text-muted">Maximum Investment</span>
                        <span className="fw-bold">${(Number(normalizedInvestment.maxInvestment) || 0).toLocaleString()}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <span className="text-muted">Payment Schedule</span>
                        <span className="fw-bold">{normalizedInvestment.paymentSchedule || 'N/A'}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center py-2">
                        <span className="text-muted">Exit Strategy</span>
                        <span className="fw-bold">{normalizedInvestment.exitStrategy || 'N/A'}</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Legal Documents */}
            {investment.legalDocuments && investment.legalDocuments.length > 0 && (
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="mb-3 fw-bold">Legal Documents</h5>
                  <div className="d-flex flex-column gap-2">
                    {investment.legalDocuments.map((doc, index) => (
                      <div key={index} className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                        <span className="fw-semibold">{doc.name}</span>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          href={doc.url}
                          target="_blank"
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>

          {/* Sidebar - Investment Summary */}
          <Col lg={4}>
            <div className="sticky-top" style={{ top: '20px' }}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-primary text-white py-3">
                  <h5 className="mb-0 fw-bold">Investment Summary</h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <div className="text-center mb-4 p-4 bg-light rounded">
                    <div className="text-muted small mb-2">Expected Return</div>
                    <h2 className="text-success mb-2 fw-bold">${(parseFloat(investmentAmount || normalizedInvestment.minInvestment || 0) * ((normalizedInvestment.expectedROI || 0) / 100) || 0).toLocaleString()}</h2>
                    <div className="text-muted small">Based on {normalizedInvestment.expectedROI || 0}% ROI</div>
                  </div>

                  <div className="mb-3 pb-3 border-bottom">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Investment Term</span>
                      <strong>{normalizedInvestment.termMonths || 0} months</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Risk Level</span>
                      <Badge bg={riskInfo.color}>{riskInfo.level}</Badge>
                    </div>
                  </div>

                  {(vendor || investment.sponsor) && (
                    <div className="mb-3 pb-3 border-bottom">
                      <div className="text-muted small mb-2">Investment Company</div>
                      <div className="fw-bold mb-1">{vendor?.companyName || investment.sponsor?.name || 'N/A'}</div>
                      <div className="text-muted small">{vendor?.email || 'N/A'}</div>
                    </div>
                  )}

                  {investment.status === 'funded' && (
                    <Alert variant="info" className="mb-0">
                      This investment opportunity is fully funded.
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Investment Modal */}
      <Modal show={showInvestModal} onHide={() => setShowInvestModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Invest in {investment.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Investment Amount</Form.Label>
              <Form.Control
                type="number"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                min={normalizedInvestment.minInvestment}
                max={normalizedInvestment.maxInvestment}
                placeholder={`Minimum: $${(Number(normalizedInvestment.minInvestment) || 0).toLocaleString()}`}
              />
              <Form.Text className="text-muted">
                Minimum: ${(Number(normalizedInvestment.minInvestment) || 0).toLocaleString()} | 
                Maximum: ${(Number(normalizedInvestment.maxInvestment) || 0).toLocaleString()}
              </Form.Text>
            </Form.Group>

            <Alert variant="info">
              <h6>Investment Summary</h6>
              <p className="mb-1">
                <strong>Amount:</strong> ${(parseFloat(investmentAmount || 0) || 0).toLocaleString()}
              </p>
              <p className="mb-1">
                <strong>Expected Return:</strong> ${(parseFloat(investmentAmount || 0) * ((normalizedInvestment.expectedROI || 0) / 100) || 0).toLocaleString()}
              </p>
              <p className="mb-0">
                <strong>Term:</strong> {normalizedInvestment.termMonths || 0} months
              </p>
            </Alert>

            <Alert variant="warning">
              <h6>Important Notice</h6>
              <p className="mb-0">
                Your investment will be secured by the property collateral. 
                The investment company must provide original property documents 
                before funds are released.
              </p>
            </Alert>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowInvestModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={handleInvest}
            disabled={processing || !investmentAmount}
          >
            {processing ? 'Processing...' : 'Confirm Investment'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default InvestmentDetail;