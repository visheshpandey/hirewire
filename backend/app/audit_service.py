import json
from app.database import AuditLog


def create_audit_log(
    db,
    action,
    entity_type=None,
    entity_id=None,
    source=None,
    details=None
):
    """
    Store an audit trail entry.
    """

    if isinstance(details, (dict, list)):
        details = json.dumps(details, default=str)

    log = AuditLog(
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        source=source,
        details=details
    )

    db.add(log)
    db.commit()
    
    db.refresh(log)

    return log


def get_audit_logs(
    db,
    entity_type=None,
    entity_id=None,
    action=None
):
    """
    Retrieve audit logs with optional filters.
    """

    query = db.query(AuditLog)

    if entity_type:
        query = query.filter(
            AuditLog.entity_type == entity_type
        )

    if entity_id is not None:
        query = query.filter(
            AuditLog.entity_id == entity_id
        )

    if action:
        query = query.filter(
            AuditLog.action == action
        )

    return query.order_by(
        AuditLog.id.desc()
    ).all()