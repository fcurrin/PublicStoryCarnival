import csv
import fileinput
import os
from dotenv import load_dotenv

'''
In each log file, ensure that all activity for any research team member listed in the env file has "Researcher?" marked as true
'''

load_dotenv()

researchers = eval(os.getenv('RESEARCHERS'))

''' start agent-actions '''
csv_file = fileinput.input(files=('logs/agent-actions.csv'), inplace=True, mode='r') # inplace = True means print will write back to the input file
reader = csv.DictReader(csv_file)

print(",".join(reader.fieldnames))  # print back the headers

for row in reader:
    if row["User"] in researchers:
        row["Researcher?"] = "true"
    print(",".join([row["User"], row["Lang"], row["Researcher?"], row["Date"], row["Action"]]))

csv_file.close()

print("Done updating agent-actions file.")
''' end agent-actions '''

''' start started-stories '''
csv_file = fileinput.input(files=('logs/started-stories.csv'), inplace=True, mode='r') # inplace = True means print will write back to the input file
reader = csv.DictReader(csv_file)

print(",".join(reader.fieldnames))  # print back the headers

for row in reader:
    if row["User"] in researchers:
        row["Researcher?"] = "true"
    print(",".join([row["User"], row["Lang"], row["Researcher?"], row["Date"], row["Story"]]))

csv_file.close()

print("Done updating started-stories file.")
''' end started-stories '''

''' start completed-stories '''
csv_file = fileinput.input(files=('logs/completed-stories.csv'), inplace=True, mode='r') # inplace = True means print will write back to the input file
reader = csv.DictReader(csv_file, dialect='excel', delimiter=',', quotechar='"', skipinitialspace=True) # skipinitialspace allows comma-separated lists enclosed in double quotes to be read as a single value

print(",".join(reader.fieldnames))  # print back the headers

for row in reader:
    if row["User"] in researchers:
        row["Researcher?"] = "true"
    # Note: need to use double quotes to delimit values that contain lists
    print(",".join([row["User"], row["Lang"], row["Researcher?"], row["Role"], row["Date"], row["Story"], row["ChosenBackground"], "\"" + row["ChosenCharacters"] + "\"", "\"" + row["ChosenObjects"] + "\"", row["Played/Skipped/Saved"], row ["NumPlayers"], "\"" + row["CharactersPicked"] + "\""]))

csv_file.close()

print("Done updating completed-stories file.")
''' end completed-stories '''