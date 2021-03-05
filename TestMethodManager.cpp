#include "TestMethodManager.h"

#include <QDebug>

TestMethodManager::TestMethodManager(QSettings *settings, QObject *parent) : QObject(parent), _settings(settings),  _scriptEngine(this)
{
    _scriptEngine.installExtensions(QJSEngine::ConsoleExtension);

    _scriptEngine.globalObject().setProperty("methodManager", _scriptEngine.newQObject(this));
//    evaluateScriptFromFile(settings->value("workDirectory").toString() + "/init.js");
    evaluateScriptsFromDirectory(settings->value("workDirectory").toString() + "/sequences");
}

void TestMethodManager::addMethod(const QString& name)
{
    _methods.insert(name, {});
    setCurrentMethod(name);
}

void TestMethodManager::setCurrentMethod(const QString &name)
{
    _currentMethod = name;
}

QStringList TestMethodManager::avaliableSequencesNames() const
{
    return _methods.keys();
}

QStringList TestMethodManager::currentMethodGeneralFunctionNames() const
{
    QStringList names;
    for(auto & i : _methods[_currentMethod].generalFunctionList)
    {
        names.push_back(i.functionName);
    }

    return names;
}

QStringList TestMethodManager::currentMethodSequenceFunctionNames() const
{
    QStringList names;
    for(auto & i : _methods[_currentMethod].testSequenceFunctionList)
    {
        names.push_back(i.functionName);
    }

    return names;
}

void TestMethodManager::runTestFunction(const QString &name)
{
    for(auto & i : _methods[_currentMethod].generalFunctionList)
    {
        if(i.functionName == name)
        {
            i.function.call();
            break;
        }
    }
}

void TestMethodManager::addFunctionToGeneralList(const QString &name, const QJSValue &function)
{
    _methods[_currentMethod].generalFunctionList.push_back({name, function});
}

void TestMethodManager::addFunctionToTestSequence(const QString &name, const QJSValue &function)
{
    _methods[_currentMethod].testSequenceFunctionList.push_back({name, function});
}

QJSValue TestMethodManager::evaluateScriptFromFile(const QString &scriptFileName)
{
    QFile scriptFile(scriptFileName);
    scriptFile.open(QIODevice::ReadOnly | QIODevice::Text);
    QTextStream in(&scriptFile);
    in.setCodec("Utf-8");
    QJSValue scriptResult = _scriptEngine.evaluate(QString(in.readAll()));
    scriptFile.close();
    return scriptResult;
}

QList<QJSValue> TestMethodManager::evaluateScriptsFromDirectory(const QString& directoryName)
{
    QDir scriptsDir = QDir(directoryName, "*.js", QDir::Name, QDir::Files);
    QStringList fileNames = scriptsDir.entryList();
    QList<QJSValue> results;

    for (auto & i : fileNames)
    {
        results.push_back(evaluateScriptFromFile(scriptsDir.absoluteFilePath(i)));
    }

    return results;
}

QJSValue TestMethodManager::runScript(const QString& scriptName, const QJSValueList& args)
{
    return _scriptEngine.globalObject().property(scriptName).call(args);
}
