'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton,
  Collapse,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

import costsConfig from '@/config/costs-config.json';
import MongoM0HealthTab from '@/components/costs/MongoM0HealthTab';
import WhatIfTab from '@/components/costs/WhatIfTab';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`costs-tabpanel-${index}`}
      aria-labelledby={`costs-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function getRiskIcon(risk) {
  switch (risk) {
    case 'safe':
    case 'forever_free':
      return <CheckCircleIcon sx={{ color: 'success.main' }} />;
    case 'watch':
      return <WarningIcon sx={{ color: 'warning.main' }} />;
    case 'paid':
      return <AttachMoneyIcon sx={{ color: 'info.main' }} />;
    default:
      return <CheckCircleIcon sx={{ color: 'success.main' }} />;
  }
}

function getRiskChip(risk) {
  const config = {
    safe: { label: 'Safe', color: 'success' },
    forever_free: { label: 'Forever Free', color: 'success' },
    watch: { label: 'Watch', color: 'warning' },
    paid: { label: 'Paid', color: 'info' },
  };
  const { label, color } = config[risk] || config.safe;
  return <Chip label={label} color={color} size="small" />;
}

function UsageProgress({ current, limit, unit }) {
  if (!limit || current === null || current === undefined) {
    return <Typography variant="body2" color="text.secondary">N/A</Typography>;
  }
  const percentage = Math.min((current / limit) * 100, 100);
  const color = percentage > 80 ? 'error' : percentage > 60 ? 'warning' : 'success';

  return (
    <Box sx={{ width: '100%', minWidth: 120 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption">{current.toLocaleString()} / {limit.toLocaleString()}</Typography>
        <Typography variant="caption">{percentage.toFixed(0)}%</Typography>
      </Box>
      <LinearProgress variant="determinate" value={percentage} color={color} />
      <Typography variant="caption" color="text.secondary">{unit}</Typography>
    </Box>
  );
}

// Current Status Tab
function CurrentStatusTab({ services, liveData, loading }) {
  const categories = [...new Set(services.map(s => s.category))];

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Services with API integration show live usage data. Others are manually estimated.
      </Alert>

      {categories.map(category => (
        <Box key={category} sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1, textTransform: 'capitalize' }}>
            {category}
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell>Service</TableCell>
                  <TableCell>Tier</TableCell>
                  <TableCell>Free Limit</TableCell>
                  <TableCell>Usage</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Cost/mo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {services.filter(s => s.category === category).map(service => {
                  const live = liveData[service.id];
                  const currentUsage = live?.usage ?? service.currentUsage;

                  return (
                    <TableRow key={service.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getRiskIcon(service.risk)}
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {service.name}
                            </Typography>
                            {service.apiIntegration && (
                              <Chip label="Live" size="small" color="primary" variant="outlined" sx={{ height: 16, fontSize: 10 }} />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={service.tier}
                          size="small"
                          color={service.tierPaid ? 'primary' : 'default'}
                          variant={service.tierPaid ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell>
                        {service.freeLimit ? (
                          <Typography variant="body2">
                            {service.freeLimit.toLocaleString()} {service.freeLimitUnit}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {service.freeLimitUnit || 'N/A'}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {loading && service.apiIntegration ? (
                          <CircularProgress size={16} />
                        ) : (
                          <UsageProgress
                            current={currentUsage}
                            limit={service.freeLimit}
                            unit={service.usageUnit}
                          />
                        )}
                      </TableCell>
                      <TableCell>{getRiskChip(service.risk)}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={service.monthlyCost > 0 ? 'bold' : 'normal'}>
                          ${service.monthlyCost}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}
    </Box>
  );
}

// Growth Forecast Tab
function GrowthForecastTab({ scenarios, services }) {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Projections based on typical usage patterns. Actual costs may vary.
      </Alert>

      <Grid container spacing={3}>
        {scenarios.map(scenario => (
          <Grid item xs={12} md={6} key={scenario.id}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">{scenario.name}</Typography>
                  <Chip
                    label={`$${scenario.totalMonthly}/mo`}
                    color="primary"
                    sx={{ fontWeight: 'bold', fontSize: '1rem' }}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Chip label={`${scenario.users.toLocaleString()} users`} size="small" variant="outlined" />
                  <Chip label={`${scenario.eventsPerDay} events/day`} size="small" variant="outlined" />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => toggleExpand(scenario.id)}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Cost Breakdown
                  </Typography>
                  <IconButton size="small">
                    {expanded[scenario.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>

                <Collapse in={expanded[scenario.id]}>
                  <TableContainer sx={{ mt: 1 }}>
                    <Table size="small">
                      <TableBody>
                        {scenario.projectedCosts.map(cost => {
                          const service = services.find(s => s.id === cost.service);
                          return (
                            <TableRow key={cost.service}>
                              <TableCell sx={{ border: 0, py: 0.5 }}>
                                {service?.name || cost.service}
                              </TableCell>
                              <TableCell sx={{ border: 0, py: 0.5 }} align="right">
                                ${cost.cost}
                              </TableCell>
                              <TableCell sx={{ border: 0, py: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
                                {cost.notes}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Collapse>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

// Watch List Tab
function WatchListTab({ watchList, services }) {
  return (
    <Box>
      <Alert severity="warning" sx={{ mb: 2 }}>
        Services approaching free tier limits. Monitor these for potential cost increases.
      </Alert>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'warning.light' }}>
              <TableCell>Priority</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Trigger Point</TableCell>
              <TableCell>Recommended Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {watchList.map(item => {
              const service = services.find(s => s.id === item.serviceId);
              return (
                <TableRow key={item.serviceId} hover>
                  <TableCell>
                    <Chip
                      label={`#${item.priority}`}
                      size="small"
                      color={item.priority <= 2 ? 'warning' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {service?.name || item.serviceId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{item.trigger}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {item.action}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Potential Future Services</Typography>
        <Grid container spacing={2}>
          {costsConfig.potentialFuture.map(item => (
            <Grid item xs={12} sm={6} md={4} key={item.name}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="medium">{item.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.purpose}</Typography>
                  <Typography variant="caption" color="primary">{item.estimatedCost}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}

// Configuration Tab
function ConfigurationTab({ lastUpdated }) {
  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Configuration is stored in <code>src/config/costs-config.json</code>.
        Edit this file to update service definitions, tiers, and projections.
      </Alert>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>API Integrations Status</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Service</TableCell>
                  <TableCell>Integration</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Credentials</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Application Insights</TableCell>
                  <TableCell>Azure Monitor API</TableCell>
                  <TableCell><Chip label="Active" color="success" size="small" /></TableCell>
                  <TableCell>APPINSIGHTS_APP_ID, APPINSIGHTS_API_KEY</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>MongoDB Atlas</TableCell>
                  <TableCell>Atlas Admin API</TableCell>
                  <TableCell><Chip label="Pending" color="warning" size="small" /></TableCell>
                  <TableCell>MONGODB_ATLAS_PUBLIC_KEY, MONGODB_ATLAS_PRIVATE_KEY</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Vercel</TableCell>
                  <TableCell>Vercel API</TableCell>
                  <TableCell><Chip label="Pending" color="warning" size="small" /></TableCell>
                  <TableCell>VERCEL_TOKEN</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>GitHub</TableCell>
                  <TableCell>GitHub API</TableCell>
                  <TableCell><Chip label="Phase 3" color="default" size="small" /></TableCell>
                  <TableCell>GITHUB_TOKEN</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Firebase</TableCell>
                  <TableCell>Admin SDK</TableCell>
                  <TableCell><Chip label="Phase 3" color="default" size="small" /></TableCell>
                  <TableCell>Service Account JSON</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Typography variant="body2" color="text.secondary">
        Last configuration update: {lastUpdated}
      </Typography>
    </Box>
  );
}

export default function CostForecastPage() {
  const [tabValue, setTabValue] = useState(0);
  const [liveData, setLiveData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { services, scenarios, watchList, lastUpdated } = costsConfig;

  // Calculate current total
  const currentTotal = services.reduce((sum, s) => sum + s.monthlyCost, 0);

  const fetchLiveData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/costs/live');
      if (!response.ok) throw new Error('Failed to fetch live data');
      const data = await response.json();
      setLiveData(data);
    } catch (err) {
      console.error('Error fetching live data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Cost Forecast
          </Typography>
          <Typography variant="body1" color="text.secondary">
            MasterCalendar Stack - {services.length} Services
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h5" color="primary">
            ${currentTotal}/mo
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Current monthly cost
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Tooltip title="Refresh live data">
              <IconButton onClick={fetchLiveData} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Current Status" />
          <Tab label="Growth Forecast" />
          <Tab label="M0 Health" />
          <Tab label="What-If" />
          <Tab label="Watch List" />
          <Tab label="Configuration" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <CurrentStatusTab services={services} liveData={liveData} loading={loading} />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <GrowthForecastTab scenarios={scenarios} services={services} />
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        <MongoM0HealthTab config={costsConfig.mongoM0Health} />
      </TabPanel>
      <TabPanel value={tabValue} index={3}>
        <WhatIfTab config={costsConfig.whatIfModel} />
      </TabPanel>
      <TabPanel value={tabValue} index={4}>
        <WatchListTab watchList={watchList} services={services} />
      </TabPanel>
      <TabPanel value={tabValue} index={5}>
        <ConfigurationTab lastUpdated={lastUpdated} />
      </TabPanel>
    </Box>
  );
}
