import './TopicBrowser.css';

export function TopicBrowser() {
    const topics = [
        {
            name: 'user-activity-events',
            partitions: 1,
            replicationFactor: 1,
            messages: 1250,
            size: '2.3 MB',
            status: 'active'
        }
    ];

    return (
        <div className="topic-browser">
            <div className="browser-header">
                <h3>📋 Topic Browser</h3>
                <p>Explore Kafka topics and their metadata</p>
            </div>

            <div className="topics-list">
                {topics.map((topic) => (
                    <div key={topic.name} className="topic-card">
                        <div className="topic-header">
                            <h4>{topic.name}</h4>
                            <span className={`topic-status ${topic.status}`}>
                                {topic.status}
                            </span>
                        </div>
                        <div className="topic-details">
                            <div className="detail-item">
                                <span className="detail-label">Partitions:</span>
                                <span className="detail-value">{topic.partitions}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Replication:</span>
                                <span className="detail-value">{topic.replicationFactor}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Messages:</span>
                                <span className="detail-value">{topic.messages.toLocaleString()}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Size:</span>
                                <span className="detail-value">{topic.size}</span>
                            </div>
                        </div>
                        <div className="topic-actions">
                            <button className="action-button">📊 View Messages</button>
                            <button className="action-button">⚙️ Configure</button>
                            <button className="action-button">📈 Monitor</button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="browser-footer">
                <p>Topic management features coming soon! This will include message inspection, partition management, and topic configuration.</p>
            </div>
        </div>
    );
}
