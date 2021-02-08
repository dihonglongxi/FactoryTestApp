#include "RailtestClient.h"

#include <QDebug>

#include <QCoreApplication>
#include <QTime>

RailtestClient::RailtestClient(const QSharedPointer<QSettings> &settings, QObject *parent)
    : QObject(parent), _settings(settings)
{
    connect(&m_serial, &QSerialPort::readyRead, this, &RailtestClient::onSerialPortReadyRead);
    connect(&m_serial, &QSerialPort::errorOccurred, this, &RailtestClient::onSerialPortErrorOccurred);
}

RailtestClient::~RailtestClient()
{
    close();
}

void RailtestClient::setLogger(const QSharedPointer<Logger> &logger)
{
    _logger = logger;
}

bool RailtestClient::open(const QString &portName)
{
    close();
    m_serial.setPortName(portName);
    m_serial.setBaudRate(QSerialPort::Baud115200);
    m_serial.setDataBits(QSerialPort::Data8);
    m_serial.setParity(QSerialPort::NoParity);
    m_serial.setStopBits(QSerialPort::OneStop);
    m_serial.setFlowControl(QSerialPort::NoFlowControl);

    return m_serial.open(QSerialPort::ReadWrite);
}

bool RailtestClient::open()
{
    QString portName = _settings->value("Railtest/serial", "COM1").toString();
    return open(portName);
}

void RailtestClient::close()
{
    if (m_serial.isOpen())
    {
        m_serial.flush();
        m_serial.close();
        m_recvBuffer.clear();
    }
}

bool RailtestClient::waitCommandPrompt(int timeout)
{
    if (!m_serial.isOpen())
        return false;

    m_syncCommand = "__waitCommandPrompt__";

    QTime expire = QTime::currentTime().addMSecs(timeout);

    m_serial.write("\r\n");
    while (QTime::currentTime() <= expire)
    {
        QCoreApplication::processEvents();
        if (m_syncCommand.isEmpty())
            return true;
    }

    return false;
}

QVariantList RailtestClient::syncCommand(const QByteArray &cmd, const QByteArray &args, int timeout)
{
    if (!m_serial.isOpen())
        return QVariantList();

    m_syncCommand = cmd;
    m_syncReplies.clear();

    QTime expire = QTime::currentTime().addMSecs(timeout);

    m_serial.write(cmd + " " + args + "\r\n");
    while (QTime::currentTime() <= expire)
    {
        QCoreApplication::processEvents();
        if (m_syncCommand.isEmpty())
            return m_syncReplies;
    }

    QVariantMap error;

    error.insert("error", "timeout");
    error.insert("errorCode", 1);
    m_syncReplies.append(error);

    return m_syncReplies;
}

QByteArray RailtestClient::readChipId()
{
    auto reply = syncCommand("getmemw", "0x0FE081F0 2");

    if (reply.size() != 2)
        return QByteArray();

    auto
        llo = reply.at(0).toList(),
        lhi = reply.at(1).toList();

    if (llo.size() != 2 || lhi.size() != 2)
        return QByteArray();

    auto
       lo = llo.at(1).toByteArray().trimmed(),
       hi = lhi.at(1).toByteArray().trimmed();

    if (!(lo.startsWith("0x") && hi.startsWith("0x")))
        return QByteArray();

    return (hi.mid(2) + lo.mid(2)).toUpper();
}

void RailtestClient::testRadio()
{
    _logger->logInfo("Testing Radio Interface...");

    _settings->beginGroup("Radio");

    RailtestClient rf(_settings, this);

    connect(&rf, &RailtestClient::replyReceived, this, &RailtestClient::onRfReplyReceived);
    if (!rf.open(_settings->value("Serial", "COM2").toString()))
    {
        _logger->logError("Cannot open serial port for reference radio module!");
    }

    rf.syncCommand("reset", "", 3000);
    if (!rf.waitCommandPrompt())
    {
        _logger->logError("Timeout waiting reference radio module command prompt!");
    }

    rf.syncCommand("rx", "0", 1000);
    _rfRSSI = 255;
    _rfCount = 0;
    rf.syncCommand("setBleMode", "1", 1000);
    rf.syncCommand("setBle1Mbps", "1", 1000);
    rf.syncCommand("setChannel", "19", 1000);
    this->syncCommand("rx", "0", 1000);
    this->syncCommand("setBleMode", "1", 1000);
    this->syncCommand("setBle1Mbps", "1", 1000);
    this->syncCommand("setChannel", "19", 1000);
    this->syncCommand("setPower", "80", 1000);
    rf.syncCommand("rx", "1", 1000);
    this->syncCommand("tx", "11", 5000);

    bool isOk = true;
    if (_rfCount < 8)
    {
        _logger->logError(QString("Radio Interface failure: packet lost (%1)!").arg(_rfCount));
        isOk = false;
    }

    if (_rfRSSI < _settings->value("Min", -50).toInt() || _rfRSSI > _settings->value("Max", 20).toInt())
    {
        _logger->logError(QString("Radio Interface failure: RSSI (%1) is out of bounds!").arg(_rfRSSI));
        isOk = false;
    }

    if(isOk)
    {
        _logger->logInfo(QString("Radio Interface: RSSI=%1.").arg(_rfRSSI));
        _logger->logInfo("Radio Interface is OK.");
    }
}

void RailtestClient::testAccelerometer()
{
    _logger->logInfo("Testing Accelerometer...");

    auto reply = this->syncCommand("accl");

    if (reply.isEmpty())
    {
        _logger->logError("No reply to accelerometer command!");
        return;
    }

    auto map = reply[0].toMap();

    if (map.contains("error"))
    {
        _logger->logError(QString("Accelerometer error: %1, %2!").arg(map["error"].toString()).arg(map["errorCode"].toString()));
    }

    if (map.contains("X") && map.contains("Y") && map.contains("Z"))
    {
        auto
           x = map["X"].toDouble(),
           y = map["Y"].toDouble(),
           z = map["Z"].toDouble();

        if (x > 10 || x < -10 || y > 10 || y < -10 || z < 80 || z > 100)
        {
            _logger->logError(QString("Accelerometer failure: X=%1, Y=%2, Z=%3.").arg(x).arg(y).arg(z));
        }
        else
            _logger->logInfo(QString("Accelerometer: X=%1, Y=%2, Z=%3.").arg(x).arg(y).arg(z));
    }
    else
        _logger->logError("Wrong reply to accelerometer command!");

    _logger->logInfo("Accelerometer is OK.");
}

void RailtestClient::onRfReplyReceived(QString id, QVariantMap params)
{
    if (id == "rxPacket" && params.contains("rssi"))
    {
        bool ok;
        int rssi = params.value("rssi").toInt(&ok);

        if (ok)
        {
            ++_rfCount;
            if (rssi < _rfRSSI)
                _rfRSSI = rssi;
        }
    }
}

void RailtestClient::decodeReply(const QByteArray &reply)
{
    if (reply.startsWith("{{(") && reply.endsWith("}}"))
    {
        int idx = reply.indexOf(")}");

        if (idx == -1)
            return;

        auto name = reply.mid(3, idx - 3);
        auto params = reply.mid(idx + 2, reply.length() - idx - 3).split('}');
        QVariantMap decodedParams;

        foreach (auto param, params)
            if (param.startsWith('{'))
            {
                idx = param.indexOf(':');
                if (idx != -1)
                    decodedParams.insert(param.mid(1, idx - 1), param.mid(idx + 1));
            }

        if (m_syncCommand == name)
            m_syncReplies.append(decodedParams);
        else
            emit replyReceived(name, decodedParams);

        return;
    }

    if (reply.startsWith("{{") && reply.endsWith("}}"))
    {
        auto params = reply.mid(1, reply.length() - 2).split('}');
        QVariantList decodedParams;

        foreach (auto param, params)
            if (param.startsWith('{'))
                decodedParams.append(param.mid(1));

        if (!m_syncCommand.isEmpty())
            m_syncReplies.push_back(decodedParams);

        return;
    }
}

void RailtestClient::onSerialPortReadyRead() Q_DECL_NOTHROW
{
    while (m_serial.bytesAvailable())
        m_recvBuffer += m_serial.readAll();

    int idx = m_recvBuffer.indexOf("\r\n");

    while (idx != -1)
    {
        auto reply = m_recvBuffer.left(idx);

        decodeReply(reply);

        m_recvBuffer = m_recvBuffer.mid(idx + 2);
        idx = m_recvBuffer.indexOf("\r\n");
    }

    if (m_recvBuffer == "> ")
        m_syncCommand.clear();
}

void RailtestClient::onSerialPortErrorOccurred(QSerialPort::SerialPortError errorCode) Q_DECL_NOTHROW
{
    if (errorCode != QSerialPort::NoError)
        emit error(m_serial.errorString());
}
