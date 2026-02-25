# Monitoring Stack

This directory contains the configuration for the complete observability stack using Grafana, Loki, Promtail, and Prometheus.

## Components

### 1. **Grafana** (Port 3001)

- **Purpose**: Visualization and dashboarding platform
- **Access**: http://localhost:3001
- **Default credentials**: admin/admin (change on first login)
- **Features**:
  - Pre-configured datasources (Prometheus & Loki)
  - Combined metrics and logs visualization
  - Custom dashboards support

### 2. **Loki** (Port 3100)

- **Purpose**: Log aggregation system
- **Access**: http://localhost:3100 (API)
- **Features**:
  - Centralized log storage
  - Label-based indexing (efficient querying)
  - Integrates with Promtail for log collection

### 3. **Promtail**

- **Purpose**: Log shipping agent
- **Function**: Collects logs from Docker containers and forwards to Loki
- **Configuration**: Uses Docker labels to identify containers to monitor

### 4. **Prometheus** (Port 9090)

- **Purpose**: Metrics collection and storage
- **Access**: http://localhost:9090
- **Features**:
  - Scrapes `/metrics` endpoints from all microservices
  - Time-series metrics database
  - PromQL query language

## Architecture

```
┌─────────────────┐
│  Microservices  │
│  - books-service│──┐
│  - user-service │  │  Logs (stdout/stderr)
│  - gateway      │  │
│  - collab-editor│──┤
└─────────────────┘  │
                     ▼
                ┌──────────┐
                │ Promtail │ (collects from Docker)
                └────┬─────┘
                     │
                     ▼
                ┌─────────┐
                │  Loki   │ (stores logs)
                └────┬────┘
                     │
                     ▼
                ┌─────────┐
                │ Grafana │ (visualizes)
                └────┬────┘
                     ▲
                ┌────┴────┐
                │         │
         ┌──────┴──┐  ┌──┴────────┐
         │  Loki   │  │Prometheus │
         │  (logs) │  │ (metrics) │
         └─────────┘  └───────────┘
```

## Quick Start

### 1. Start the monitoring stack:

```bash
docker-compose up -d loki promtail prometheus grafana
```

### 2. Verify services are running:

```bash
docker-compose ps
```

### 3. Access Grafana:

- Open: http://localhost:3001
- Login: admin/admin
- Navigate to **Explore** to query logs and metrics

## Using Grafana

### Querying Logs (Loki)

1. Select **Loki** as datasource
2. Use LogQL queries:

   ```logql
   # All logs from books-service
   {service="books-service"}

   # Error logs only
   {service="books-service"} |= "error"

   # Last 5 minutes
   {service="books-service"} [5m]
   ```

### Querying Metrics (Prometheus)

1. Select **Prometheus** as datasource
2. Use PromQL queries:

   ```promql
   # Request rate
   rate(http_requests_total[5m])

   # 95th percentile latency
   histogram_quantile(0.95, http_request_duration_seconds_bucket)

   # Active connections
   http_active_connections
   ```

## Configuration Files

### promtail-config.yml

- Defines how Promtail discovers and scrapes Docker container logs
- Uses Docker labels (`logging=promtail`) to filter containers

### prometheus.yml

- Configures which services Prometheus scrapes for metrics
- Currently monitors: books-service, user-service, gateway, collab-editor

### grafana/provisioning/datasources/datasources.yml

- Auto-configures Prometheus and Loki datasources in Grafana

### grafana/provisioning/dashboards/dashboards.yml

- Enables dashboard auto-loading from files

## Environment Variables

Add to your microservice `.env` files:

```bash
# Optional: Override default Loki host
LOKI_HOST=http://loki:3100
```

## Docker Labels

To enable log collection, containers must have these labels (already configured in docker-compose.yml):

```yaml
labels:
  logging: "promtail"
  logging_job: "books-service"
```

## Retention & Storage

### Loki

- Default retention: 744h (31 days)
- Storage: Volume `loki-data`

### Prometheus

- Default retention: 15d
- Storage: Volume `prometheus-data`

### Grafana

- Storage: Volume `grafana-data`
- Dashboards, datasources, and settings persisted

## Troubleshooting

### Logs not appearing in Grafana?

1. Check Promtail is running: `docker-compose logs promtail`
2. Verify container has correct labels
3. Check Loki health: `curl http://localhost:3100/ready`

### Metrics not showing?

1. Verify Prometheus is scraping: http://localhost:9090/targets
2. Check microservice `/metrics` endpoint
3. Review Prometheus logs: `docker-compose logs prometheus`

### Grafana can't connect to datasources?

1. Verify Loki/Prometheus are running
2. Check network connectivity: `docker-compose exec grafana ping loki`
3. Review datasource configuration in Grafana UI

## Best Practices

1. **Use structured logging**: JSON format enables better filtering
2. **Add labels**: Include service name, environment, etc.
3. **Monitor metrics**: Track request rate, latency, errors
4. **Create dashboards**: Visualize key metrics and logs together
5. **Set up alerts**: Configure Grafana alerts for critical issues

## Security Notes

- Change Grafana admin password on first login
- In production, use authentication for all endpoints
- Restrict Prometheus/Loki ports to internal network
- Use HTTPS with proper certificates

## Production Considerations

1. **Scaling Loki**: Consider distributed mode for high volume
2. **Retention policies**: Adjust based on compliance requirements
3. **Backup**: Regularly backup Grafana dashboards and config
4. **Resource limits**: Set appropriate memory/CPU limits
5. **Log sampling**: For very high traffic, implement sampling
