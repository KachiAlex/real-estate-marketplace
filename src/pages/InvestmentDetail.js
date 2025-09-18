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
  ListGroup,
  Image
} from 'react-bootstrap';
import { useInvestment } from '../contexts/InvestmentContext';
import { useEscrow } from '../contexts/EscrowContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
      setInvestment(investmentData);

      // Load vendor details
      if (investmentData.vendorId) {
        const vendorRef = doc(db, 'users', investmentData.vendorId);
        const vendorDoc = await getDoc(vendorRef);
        if (vendorDoc.exists()) {
          setVendor({ id: vendorDoc.id, ...vendorDoc.data() });
        }
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
    if (!investmentAmount || parseFloat(investmentAmount) <= 0) {
      setError('Please enter a valid investment amount');
      return;
    }

    if (parseFloat(investmentAmount) < investment.minInvestment) {
      setError(`Minimum investment amount is $${investment.minInvestment.toLocaleString()}`);
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // Create escrow transaction
      const escrowId = await createEscrowTransaction(
        id,
        parseFloat(investmentAmount),
        user.uid,
        investment.vendorId
      );

      setShowInvestModal(false);
      navigate(`/escrow/${escrowId}`);
    } catch (err) {
      setError(err.message);
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

  const riskInfo = getRiskLevel(investment.riskScore);
  const progressPercentage = (investment.currentFunding / investment.targetAmount) * 100;

  return (
    <Container className="py-5">
      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h2 className="mb-0">{investment.title}</h2>
              {getStatusBadge(investment.status)}
            </Card.Header>
            <Card.Body>
              {investment.images && investment.images.length > 0 && (
                <div className="mb-4">
                  <Image 
                    src={investment.images[0]} 
                    alt={investment.title}
                    fluid
                    className="rounded"
                    style={{ maxHeight: '400px', objectFit: 'cover' }}
                  />
                </div>
              )}
              
              <h5>Investment Overview</h5>
              <p className="text-muted">{investment.description}</p>

              <Row className="mb-4">
                <Col md={6}>
                  <h6>Expected ROI</h6>
                  <p className="h4 text-success">{investment.expectedROI}%</p>
                </Col>
                <Col md={6}>
                  <h6>Investment Term</h6>
                  <p className="h4">{investment.termMonths} months</p>
                </Col>
              </Row>

              <h5>Funding Progress</h5>
              <ProgressBar 
                now={progressPercentage} 
                label={`${progressPercentage.toFixed(1)}%`}
                className="mb-2"
              />
              <div className="d-flex justify-content-between text-muted">
                <span>${investment.currentFunding.toLocaleString()} raised</span>
                <span>${investment.targetAmount.toLocaleString()} target</span>
              </div>

              <h5 className="mt-4">Property Collateral</h5>
              <Card className="bg-light">
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <p><strong>Property Type:</strong> {investment.propertyType}</p>
                      <p><strong>Location:</strong> {investment.propertyLocation}</p>
                      <p><strong>Estimated Value:</strong> ${investment.propertyValue.toLocaleString()}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Property Details:</strong></p>
                      <p className="text-muted">{investment.propertyDescription}</p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <h5 className="mt-4">Investment Terms</h5>
              <ListGroup>
                <ListGroup.Item>
                  <strong>Minimum Investment:</strong> ${investment.minInvestment.toLocaleString()}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Maximum Investment:</strong> ${investment.maxInvestment.toLocaleString()}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Risk Level:</strong> 
                  <Badge bg={riskInfo.color} className="ms-2">{riskInfo.level}</Badge>
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Payment Schedule:</strong> {investment.paymentSchedule}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Exit Strategy:</strong> {investment.exitStrategy}
                </ListGroup.Item>
              </ListGroup>

              {investment.legalDocuments && investment.legalDocuments.length > 0 && (
                <>
                  <h5 className="mt-4">Legal Documents</h5>
                  <ListGroup>
                    {investment.legalDocuments.map((doc, index) => (
                      <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                        <span>{doc.name}</span>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          href={doc.url}
                          target="_blank"
                        >
                          View Document
                        </Button>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="sticky-top" style={{ top: '20px' }}>
            <Card.Header>
              <h5>Investment Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <h6>Expected Return</h6>
                <p className="h4 text-success">${(parseFloat(investmentAmount || investment.minInvestment) * (investment.expectedROI / 100)).toLocaleString()}</p>
                <small className="text-muted">Based on {investment.expectedROI}% ROI</small>
              </div>

              <div className="mb-3">
                <h6>Investment Term</h6>
                <p>{investment.termMonths} months</p>
              </div>

              <div className="mb-3">
                <h6>Risk Assessment</h6>
                <Badge bg={riskInfo.color}>{riskInfo.level} Risk</Badge>
              </div>

              {vendor && (
                <div className="mb-4">
                  <h6>Investment Company</h6>
                  <p className="mb-1"><strong>{vendor.companyName}</strong></p>
                  <p className="text-muted small">{vendor.email}</p>
                </div>
              )}

              {investment.status === 'active' && user?.role === 'buyer' && (
                <div>
                  {escrowTransaction ? (
                    <Alert variant="info">
                      <h6>Investment in Progress</h6>
                      <p className="mb-2">You have an active escrow transaction for this investment.</p>
                      <Button 
                        variant="primary" 
                        onClick={() => navigate(`/escrow/${escrowTransaction.id}`)}
                        className="w-100"
                      >
                        View Transaction
                      </Button>
                    </Alert>
                  ) : (
                    <Button 
                      variant="success" 
                      size="lg" 
                      className="w-100"
                      onClick={() => setShowInvestModal(true)}
                    >
                      Invest Now
                    </Button>
                  )}
                </div>
              )}

              {investment.status === 'funded' && (
                <Alert variant="info">
                  This investment opportunity is fully funded.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

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
                min={investment.minInvestment}
                max={investment.maxInvestment}
                placeholder={`Minimum: $${investment.minInvestment.toLocaleString()}`}
              />
              <Form.Text className="text-muted">
                Minimum: ${investment.minInvestment.toLocaleString()} | 
                Maximum: ${investment.maxInvestment.toLocaleString()}
              </Form.Text>
            </Form.Group>

            <Alert variant="info">
              <h6>Investment Summary</h6>
              <p className="mb-1">
                <strong>Amount:</strong> ${parseFloat(investmentAmount || 0).toLocaleString()}
              </p>
              <p className="mb-1">
                <strong>Expected Return:</strong> ${(parseFloat(investmentAmount || 0) * (investment.expectedROI / 100)).toLocaleString()}
              </p>
              <p className="mb-0">
                <strong>Term:</strong> {investment.termMonths} months
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