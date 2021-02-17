#pragma once

#include <QProcess>
#include "AppComponent.h"

class JLinkManager : public QObject, public AppComponent
{
    Q_OBJECT

    public:
        explicit JLinkManager(QObject *parent = Q_NULLPTR);
        ~JLinkManager() Q_DECL_OVERRIDE;

        void setSN(const QString& serialNumber);
        QString getSN() const;

public slots:
        bool start(const QString &path, const QStringList &args = QStringList(), int timeout = 30000);
        void stop();
        bool isRunning();
        int exitCode();

        bool write(const QByteArray &data);
        QByteArray read();
        bool readUntilExpected(const QByteArray &expected, QByteArray &received, int timeout = 30000);
        bool skipUntilExpected(const QByteArray &expected, int timeout = 30000);
        void clear();
        bool readUntilFinished(QByteArray &received, int timeout = 30000);
        bool skipUntilFinished(int timeout = 30000);

private slots:
    void readStandardOutput();
    void logError(QProcess::ProcessError error);
    bool startJLinkScript(const QString& scriptFileName);

signals:
    void startScript(const QString& scriptName);
    void error(QString message);
    void log(QStringList lines);

private:

    QString _SN; // JLink serial number
    QProcess m_proc;
    QByteArray m_rdBuf;
};
